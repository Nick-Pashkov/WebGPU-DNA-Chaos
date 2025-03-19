export function createRenderPipeline(
  device: GPUDevice,
  format: GPUTextureFormat,
  code: string,
) {
  const module = device.createShaderModule({
    label: "our hardcoded red triangle shaders",
    code,
  });

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red triangle pipeline",
    layout: "auto",
    vertex: {
      module,
      buffers: [
        {
          arrayStride: 2 * 4, // 2 floats, 4 bytes each
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" }, // position
          ],
        },
      ],
    },
    fragment: {
      module,
      targets: [{ format }],
    },
    primitive: {
      topology: "point-list",
    },
  });

  return pipeline;
}
