@group(0) @binding(0) var<storage, read> input: array<u32>;
@group(0) @binding(1) var<storage, read_write> output: array<vec2<f32>>;

const corners = array<vec2<f32>, 4>(
    vec2(0.0, 0.0),  // C: Upper-left
    vec2(1.0, 0.0),  // T: Upper-right
    vec2(0.0, 1.0),  // A: Lower-left
    vec2(1.0, 1.0)   // G: Lower-right
);

@compute @workgroup_size(64)
fn computeSomething(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    var targetPoint: vec2<f32>;
    let index = id.x;
    if (index >= arrayLength(&input)) {
        return;
    }

    var current_pos = vec2(0.5, 0.5); // Start at center
    for (var i: u32 = 0; i <= index; i++) {
        let corner_index = input[i];
        targetPoint = corners[corner_index];

        current_pos = mix(current_pos, targetPoint, 0.5);
    }

    output[index] = current_pos;
}
