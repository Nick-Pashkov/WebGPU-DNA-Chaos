struct Vertex {
  @location(0) position: vec2f,
};

struct VSOutput {
  @builtin(position) position: vec4f,
};

@vertex
fn vs(vert: Vertex) -> VSOutput {
  var vsOut: VSOutput;
  vsOut.position = vec4f((vec2(vert.position.x, 1.0 - vert.position.y) - 0.5) * 2.0, 0, 1);
  return vsOut;
}

@fragment
fn fs(vsOut: VSOutput) -> @location(0) vec4f {
  return vec4f(1, 0, 0, 1);
}
