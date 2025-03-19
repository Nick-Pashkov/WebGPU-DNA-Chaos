export function createComputePipeline(device: GPUDevice, code: string) {
  const module = device.createShaderModule({ code });

  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module,
    },
  });

  return pipeline;
}

export async function execute(
  device: GPUDevice,
  pipeline: GPUComputePipeline,
  input: Uint32Array,
) {
  const startTime = performance.now();

  // The input buffer will hold the sequence numeric data
  const inputBuffer = device.createBuffer({
    size: input.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });

  // We create output array and buffer, the output will be the points coordinates, thus we multiply the input length by 2
  const outputArray = new Float32Array(input.length * 2);

  const outputBuffer = device.createBuffer({
    size: outputArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // Copy our input data to that buffer
  device.queue.writeBuffer(inputBuffer, 0, input);

  // Create a buffer on the GPU to get a copy of the results
  const resultBuffer = device.createBuffer({
    size: outputArray.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  // Setup a bindGroup to tell the shader which
  // buffer to use for the computation
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: inputBuffer } },
      { binding: 1, resource: { buffer: outputBuffer } },
    ],
  });

  // Encode commands to do the computation
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);

  // Dispatch the workgroups, since in the shader we are using a workgroup size of 64, we are going to split our work evenly in 64 threads
  // Room for improvement: Use multi-dimensional workgroups (maybe?)
  const workGroupCount = Math.ceil(input.length / 64);
  console.log("Workgroup count:", workGroupCount);
  pass.dispatchWorkgroups(workGroupCount);
  pass.end();

  // Encode a command to copy the results to a mappable buffer.
  encoder.copyBufferToBuffer(
    outputBuffer,
    0,
    resultBuffer,
    0,
    resultBuffer.size,
  );

  // Finish encoding and submit the commands
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  // Read the results
  await resultBuffer.mapAsync(GPUMapMode.READ);
  const result = new Float32Array(resultBuffer.getMappedRange());
  const toReturn = Array.from(result);

  resultBuffer.unmap();

  const endTime = performance.now();
  console.log(`Execution time: ${endTime - startTime} ms`);

  return toReturn;
}
