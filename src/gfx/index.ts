import { createComputePipeline, execute } from "./compute";
import { createRenderPipeline } from "./render";

import drawShader from "./shaders/draw.wgsl?raw";
import computeShader from "./shaders/compute.wgsl?raw";

const sequenceToValues = (sequence: string) => {
  const values = [];
  for (let i = 0; i < sequence.length; i++) {
    switch (sequence[i]) {
      case "C":
        values.push(0);
        break;
      case "T":
        values.push(1);
        break;
      case "A":
        values.push(2);
        break;
      case "G":
        values.push(3);
        break;
    }
  }

  return new Uint32Array(values);
};

/**
 * Initialize the WebGPU device and context
 * @param canvas The HTMLCanvasElement to render to
 * @returns
 */
export async function init(canvas: HTMLCanvasElement) {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    throw new Error("need a browser that supports WebGPU");
  }
  console.log("WebGPU device initialized");

  const context = canvas?.getContext("webgpu");
  if (!context) {
    throw new Error("Failed to create WebGPU context");
  }
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context?.configure({
    device,
    format: presentationFormat,
  });

  return {
    device,
    context,
    presentationFormat,
  };
}

/**
 * Performs all the process of dispatching the compute pipeline and rendering the result
 * @param initPromise Return value from calling init function
 * @param sequence The input DNA sequence
 */
export async function gfxMain(
  initPromise: ReturnType<typeof init>,
  sequence: string,
) {
  const { device, context, presentationFormat } = await initPromise;

  const renderPipeline = createRenderPipeline(
    device,
    presentationFormat,
    drawShader,
  );

  const computePipeline = createComputePipeline(device, computeShader);

  //const sequence = "AGGTCG";

  const input = sequenceToValues(sequence.trim());

  // Manually hardcode center
  const result = [0.5, 0.5, ...(await execute(device, computePipeline, input))];

  render(
    context,
    device,
    renderPipeline,
    new Float32Array(result),
    sequence.length,
  );
}

function render(
  context: GPUCanvasContext,
  device: GPUDevice,
  renderPipeline: GPURenderPipeline,
  data: Float32Array,
  length: number,
) {
  // Get the view from the canvas
  const currentView = context.getCurrentTexture().createView();
  if (!currentView) {
    throw new Error("Failed to create current view");
  }

  // Create a vertex buffer that holds all our points
  const vertexBuffer = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // Write the points to the vertex buffer
  device.queue.writeBuffer(vertexBuffer, 0, data);

  // Create the render descriptor, we just specify that we are going to clear the screen to black, and clearing everything
  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: currentView,
        clearValue: [0, 0, 0, 1],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  // Make a command encoder to start encoding commands
  const encoder = device?.createCommandEncoder({ label: "our encoder" });

  // Make a render pass encoder to encode render specific commands
  const pass = encoder?.beginRenderPass(renderPassDescriptor);
  pass?.setPipeline(renderPipeline);

  // Attach the buffer of vertices, which contains all the points
  pass.setVertexBuffer(0, vertexBuffer);

  // Specify how many points are we drawing, in other words, how many times the vertex shader will be executed
  pass?.draw(length);
  pass?.end();

  const commandBuffer = encoder?.finish();
  if (!commandBuffer) {
    throw new Error("Failed to create command buffer");
  }
  device?.queue.submit([commandBuffer]);
}
