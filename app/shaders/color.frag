uniform int window_width;
uniform int window_height;
uniform float t;

// texture_coords: (0, 0) to (1, 1) normalized
// screen_coords: pixel coordinates from top-left
vec4 effect(vec4 color, Image texture, vec2 texture_coords, vec2 screen_coords)
{
    vec4 texturecolor = Texel(texture, texture_coords);
    vec4 tint = vec4(1, 1, 1, 1);
    tint.r = screen_coords.x / window_width * abs(sin(t));
    tint.g = screen_coords.y / window_height * abs(cos(t));
    tint.b = abs(screen_coords.x - window_width/2) / (window_width/2) * abs(sin(t));
    return texturecolor * color * tint;
}
