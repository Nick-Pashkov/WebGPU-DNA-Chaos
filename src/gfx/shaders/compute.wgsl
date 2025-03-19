// Define our input array of u32 numbers
@group(0) @binding(0) var<storage, read> input: array<u32>;

// Define our output array of vectors, which will be the points
@group(0) @binding(1) var<storage, read_write> output: array<vec2<f32>>;

const corners = array<vec2<f32>, 4>(
    vec2(0.0, 0.0),  // C: Upper-left
    vec2(1.0, 0.0),  // T: Upper-right
    vec2(0.0, 1.0),  // A: Lower-left
    vec2(1.0, 1.0)   // G: Lower-right
);

// The main compute function, we are using 64 threads per workgroup
// global_invocation_id is what we will use to index into the input array
@compute @workgroup_size(64)
fn computePoints(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let index = id.x;

    // If we are out of bounds, return early
    if (index >= arrayLength(&input)) {
        return;
    }

    var current_pos = vec2(0.5, 0.5); // Start at center

    // index is the current index of the input array, we are going to calculate the
    // next position based on the current position and the target point
    for (var i: u32 = 0; i <= index; i++) {
        let corner_index = input[i];
        let targetPoint = corners[corner_index];

        // Mix will linearly interpolate between the current position and the target point,
        // with the value of 0.5 it will be halfway between the two points
        current_pos = mix(current_pos, targetPoint, 0.5);
    }

    output[index] = current_pos;
}
