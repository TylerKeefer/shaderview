uniform vec3    input_resolution;
uniform float   input_timer;
uniform vec2    input_mouse;

const float PI      = 3.1415926535898;
const float EPSILON = 0.000001;

// The MIT License
// Copyright © 2013 Inigo Quilez

// A list of useful distance function to simple primitives, and an example on how to
// do some interesting boolean operations, repetition and displacement.
//
// More info here: http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm

// Anti-aliasing
#define AA 0   // make this 1 is your machine is too slow

//------------------------------------------------------------------

float sdPlane(vec3 p)
{
    return p.y;
}

float sdSphere(vec3 p, float s)
{
    return length(p)-s;
}

float sdBox(vec3 p, vec3 b)
{
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdEllipsoid(in vec3 p, in vec3 r)
{
    return (length(p/r) - 1.0) * min(min(r.x,r.y),r.z);
}

float udRoundBox(vec3 p, vec3 b, float r)
{
    return length(max(abs(p)-b,0.0))-r;
}

float sdTorus(vec3 p, vec2 t)
{
    return length(vec2(length(p.xz)-t.x,p.y))-t.y;
}

float sdHexPrism(vec3 p, vec2 h)
{
    vec3 q = abs(p);
#if 0
    return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x);
#else
    float d1 = q.z-h.y;
    float d2 = max((q.x*0.866025+q.y*0.5),q.y)-h.x;
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
#endif
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p-a, ba = b-a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    return length(pa - ba*h) - r;
}

float sdTriPrism(vec3 p, vec2 h)
{
    vec3 q = abs(p);
#if 0
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
#else
    float d1 = q.z-h.y;
    float d2 = max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5;
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
#endif
}

float sdCylinder(vec3 p, vec2 h)
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdCone(in vec3 p, in vec3 c)
{
    vec2 q = vec2(length(p.xz), p.y);
    float d1 = -q.y-c.z;
    float d2 = max(dot(q,c.xy), q.y);
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

float sdConeSection(in vec3 p, in float h, in float r1, in float r2)
{
    float d1 = -p.y - h;
    float q = p.y - h;
    float si = 0.5*(r1-r2)/h;
    float d2 = max(sqrt(dot(p.xz,p.xz)*(1.0-si*si)) + q*si - r2, q);
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

float sdPryamid4(vec3 p, vec3 h) // h = { cos a, sin a, height }
{
    // Tetrahedron = Octahedron - Cube
    float box = sdBox(p - vec3(0,-2.0*h.z,0), vec3(2.0*h.z));

    float d = 0.0;
    d = max(d, abs(dot(p, vec3(-h.x, h.y, 0))));
    d = max(d, abs(dot(p, vec3(h.x, h.y, 0))));
    d = max(d, abs(dot(p, vec3(0, h.y, h.x))));
    d = max(d, abs(dot(p, vec3(0, h.y,-h.x))));
    float octa = d - h.z;
    return max(-box,octa); // Subtraction
 }

float length2(vec2 p)
{
    return sqrt(p.x*p.x + p.y*p.y);
}

float length6(vec2 p)
{
    p = p*p*p; p = p*p;
    return pow(p.x + p.y, 1.0/6.0);
}

float length8(vec2 p)
{
    p = p*p; p = p*p; p = p*p;
    return pow(p.x + p.y, 1.0/8.0);
}

float sdTorus82(vec3 p, vec2 t)
{
    vec2 q = vec2(length2(p.xz)-t.x,p.y);
    return length8(q)-t.y;
}

float sdTorus88(vec3 p, vec2 t)
{
    vec2 q = vec2(length8(p.xz)-t.x,p.y);
    return length8(q)-t.y;
}

float sdCylinder6(vec3 p, vec2 h)
{
    return max(length6(p.xz)-h.x, abs(p.y)-h.y);
}

//------------------------------------------------------------------

float opSub(float d1, float d2)
{
    return max(-d2,d1);
}

vec2 opUnion(vec2 d1, vec2 d2)
{
    return (d1.x<d2.x) ? d1 : d2;
}

vec3 opRepeat(vec3 p, vec3 c)
{
    return mod(p,c)-0.5*c;
}

vec3 opTwist(vec3 p)
{
    float  c = cos(10.0*p.y+10.0);
    float  s = sin(10.0*p.y+10.0);
    mat2   m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}

//------------------------------------------------------------------

vec2 map(in vec3 pos)
{
    // Start with a plane
    vec2 result = vec2(sdPlane(pos), 1);

    // Create a round box, then subtract a sphere from it
    result = opUnion(result,
        vec2(
            opSub(
                udRoundBox(  pos-vec3(0, 0.25, 0), vec3(0.15), 0.05),
                sdSphere(    pos-vec3(0, 0.25, 0), 0.25)
            ),
        13.0)
    );

    /* result = opUnion( */
    /*     vec2(sdPlane(pos), 1.0), */
    /*     vec2(sdSphere(pos - vec3(0, 0.25, 0), 0.25), 50) */
    /* ); */

    /* result = opUnion( result, vec2( sdBox(       pos-vec3( 1.0,0.25, 0.0), vec3(0.25) ), 3.0 ) ); */
    /* result = opUnion( result, vec2( udRoundBox(  pos-vec3( 1.0,0.25, 1.0), vec3(0.15), 0.1 ), 41.0 ) ); */
    /* result = opUnion( result, vec2( sdTorus(     pos-vec3( 0.0,0.25, 1.0), vec2(0.20,0.05) ), 25.0 ) ); */
    /* result = opUnion( result, vec2( sdCapsule(   pos,vec3(-1.3,0.10,-0.1), vec3(-0.8,0.50,0.2), 0.1  ), 31.9 ) ); */
    /* result = opUnion( result, vec2( sdTriPrism(  pos-vec3(-1.0,0.25,-1.0), vec2(0.25,0.05) ),43.5 ) ); */
    /* result = opUnion( result, vec2( sdCylinder(  pos-vec3( 1.0,0.30,-1.0), vec2(0.1,0.2) ), 8.0 ) ); */
    /* result = opUnion( result, vec2( sdCone(      pos-vec3( 0.0,0.50,-1.0), vec3(0.8,0.6,0.3) ), 55.0 ) ); */
    /* result = opUnion( result, vec2( sdTorus82(   pos-vec3( 0.0,0.25, 2.0), vec2(0.20,0.05) ),50.0 ) ); */
    /* result = opUnion( result, vec2( sdTorus88(   pos-vec3(-1.0,0.25, 2.0), vec2(0.20,0.05) ),43.0 ) ); */
    /* result = opUnion( result, vec2( sdCylinder6( pos-vec3( 1.0,0.30, 2.0), vec2(0.1,0.2) ), 12.0 ) ); */
    /* result = opUnion( result, vec2( sdHexPrism(  pos-vec3(-1.0,0.20, 1.0), vec2(0.25,0.05) ),17.0 ) ); */
    /* result = opUnion( result, vec2( sdPryamid4(  pos-vec3(-1.0,0.15,-2.0), vec3(0.8,0.6,0.25) ),37.0 ) ); */
    /* result = opUnion( result, vec2( opSub( sdTorus82(  pos-vec3(-2.0,0.2, 0.0), vec2(0.20,0.1)), */
    /*                            sdCylinder(  opRepeat( vec3(atan(pos.x+2.0,pos.z)/6.2831, pos.y, 0.02+0.5*length(pos-vec3(-2.0,0.2, 0.0))), vec3(0.05,1.0,0.05)), vec2(0.02,0.6))), 51.0 ) ); */
    /* result = opUnion( result, vec2( 0.5*sdSphere(    pos-vec3(-2.0,0.25,-1.0), 0.2 ) + 0.03*sin(50.0*pos.x)*sin(50.0*pos.y)*sin(50.0*pos.z), 65.0 ) ); */
    /* result = opUnion( result, vec2( 0.5*sdTorus( opTwist(pos-vec3(-2.0,0.25, 2.0)),vec2(0.20,0.05)), 46.7 ) ); */
    /* result = opUnion( result, vec2( sdConeSection( pos-vec3( 0.0,0.35,-2.0), 0.15, 0.2, 0.1 ), 13.67 ) ); */
    /* result = opUnion( result, vec2( sdEllipsoid( pos-vec3( 1.0,0.35,-2.0), vec3(0.15, 0.2, 0.05) ), 43.17 ) ); */

    return result;
}

vec2 castRay(in vec3 ro, in vec3 rd)
{
    float tmin = EPSILON;
    float tmax = 20.0;

#if 1
    // bounding volume
    float tp1 = (0.0-ro.y)/rd.y; if(tp1>0.0) tmax = min(tmax, tp1);
    float tp2 = (1.6-ro.y)/rd.y; if(tp2>0.0) { if(ro.y>1.6) tmin = max(tmin, tp2);
                                                 else           tmax = min(tmax, tp2); }
#endif

    float t = tmin;
    float m = -1.0;
    for(int i=0; i<64; i++)
    {
        float precis = 0.000001 * t;
        vec2 res = map(ro+rd*t);
        if(res.x<precis || t>tmax) break;
        t += res.x;
        m = res.y;
    }

    if(t>tmax) m=-1.0;
    return vec2(t, m);
}

float softshadow(in vec3 ro, in vec3 rd, in float mint, in float tmax)
{
    float res = 1.0;
    float t = mint;
    for(int i=0; i<16; i++)
    {
        float h = map(ro + rd*t).x;
        res = min(res, 8.0*h/t);
        t += clamp(h, 0.02, 0.10);
        if(h<EPSILON || t>tmax) break;
    }
    return clamp(res, 0.0, 1.0);
}

vec3 calcNormal(in vec3 pos)
{
    vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
    return normalize(e.xyy*map( pos + e.xyy ).x +
            e.yyx*map(pos + e.yyx).x +
            e.yxy*map(pos + e.yxy).x +
            e.xxx*map(pos + e.xxx).x);
    /*
    vec3 eps = vec3( 0.0005, 0.0, 0.0 );
    vec3 nor = vec3(
        map(pos+eps.xyy).x - map(pos-eps.xyy).x,
        map(pos+eps.yxy).x - map(pos-eps.yxy).x,
        map(pos+eps.yyx).x - map(pos-eps.yyx).x );
    return normalize(nor);
    */
}

float calcAO(in vec3 pos, in vec3 nor)
{
    float occ = 0;
    float sca = 1.0;
    for(int i=0; i<5; i++)
    {
        float hr = 0.01 + 0.12*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map(aopos).x;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );
}

vec3 sky(in vec3 ray_dir)
{
    return vec3(0.7, 0.9, 1.0) + ray_dir.y * 0.8;
}

vec3 render(in vec3 ro, in vec3 rd)
{
    vec3 color = sky(rd);
    vec2 ray = castRay(ro, rd);
    float t = ray.x;

    if(ray.y > -0.5)
    {
        vec3 pos = ro + ray.x*rd;
        vec3 nor = calcNormal(pos);
        vec3 ref = reflect(rd, nor);

        // material
        color = 0.45 + 0.35*sin(vec3(0.05,0.08,0.10)*(ray.y-1.0));
        if(ray.y<1.5)
        {
            float f = mod(floor(5.0*pos.z) + floor(5.0*pos.x), 2.0);
            color = 0.3 + 0.1*f*vec3(1.0);
        }

        // lighting

        // Ambient Occlusion
        float occ = calcAO(pos, nor);

        //
        vec3  lig = normalize(vec3(-0.4, 0.7, -0.6));

        // Ambient
        float amb = clamp(0.5+0.5*nor.y, 0, 1);

        // Diffuse
        float dif = clamp(dot(nor, lig), 0, 1);

        //
        float bac = clamp(dot(nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0)*clamp(1.0-pos.y,0.0,1.0);

        //
        float dom = smoothstep(-0.1, 0.1, ref.y);

        // Fresnel
        float fre = pow(clamp(1.0+dot(nor,rd),0.0,1.0), 2.0);

        // Specular
        float spe = pow(clamp(dot(ref, lig), 0.0, 1.0),16.0);

        dif *= softshadow(pos, lig, 0.02, 2.5);
        dom *= softshadow(pos, ref, 0.02, 2.5);

        vec3 lighting = vec3(0.0);
        lighting += 1.30*dif*vec3(1.00,0.80,0.55);
        lighting += 2.00*spe*vec3(1.00,0.90,0.70)*dif;
        lighting += 0.40*amb*vec3(0.40,0.60,1.00)*occ;
        lighting += 0.50*dom*vec3(0.40,0.60,1.00)*occ;
        lighting += 0.50*bac*vec3(0.25,0.25,0.25)*occ;
        lighting += 0.25*fre*vec3(1.00,1.00,1.00)*occ;
        color = color * lighting;

        // Fog
        float fog_falloff = 0.0002;
        color = mix(color, vec3(0.8,0.9,1.0), 1.0 - exp(-fog_falloff * ray.x * ray.x * ray.x));
    }

    return vec3(clamp(color, 0, 1));
}

mat3 setCamera(in vec3 ro, in vec3 ta, float cr)
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize(cross(cw,cp));
    vec3 cv = normalize(cross(cu,cw));
    return mat3(cu, cv, cw);
}

vec4 effect(vec4 color, Image texture, vec2 texture_coords, vec2 fragCoord)
{
    fragCoord.y = input_resolution.y - fragCoord.y;

    vec3 total_color = vec3(0);
#if AA>1
    for(int m=0; m<AA; m++)
    for(int n=0; n<AA; n++)
    {
        // pixel coordinates
        vec2 o = vec2(float(m),float(n)) / float(AA) - 0.5;
        vec2 p = (-input_resolution.xy + 2.0*(fragCoord+o))/input_resolution.y;
#else
        vec2 p = (-input_resolution.xy + 2.0*fragCoord)/input_resolution.y;
#endif

        float rotation_speed = 0.3;

        // camera
        vec3 camera_pos = vec3(0);
        camera_pos.y = 0.7;
        camera_pos.z = sin(2 * PI * input_mouse.x / input_resolution.x);
        camera_pos.x = cos(2 * PI * input_mouse.x / input_resolution.x);
        vec3 target = vec3(0, 0.25, 0);

        float camera_rotation = 0;

        // camera-to-world transformation
        mat3 ca = setCamera(camera_pos, target, camera_rotation);

        // ray direction
        vec3 ray_dir = ca * normalize(vec3(p.xy, 2.0));

        // render world
        vec3 output_color = render(camera_pos, ray_dir);

        // gamma correction
        output_color = pow(output_color, vec3(0.4545));

        total_color += output_color;
#if AA>1
    }
    total_color /= float(AA*AA);
#endif

    return vec4(total_color, 1.0);
}
