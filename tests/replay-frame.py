#!/usr/bin/env python3
"""Compile the game's actual GLSL and render its captured meshes with Mesa EGL."""
import base64
import ctypes as C
import gzip
import json
import os
import re
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
os.environ.setdefault('MESA_SHADER_CACHE_DIR','/tmp/iskra-mesa-cache')
frame=json.loads(gzip.decompress((ROOT/'dist/frame.json.gz').read_bytes()))
W,H=frame['width'],frame['height']
E=C.CDLL('libEGL.so.1')
E.eglGetProcAddress.argtypes=[C.c_char_p];E.eglGetProcAddress.restype=C.c_void_p
def egl(name,result,args):
    f=getattr(E,name);f.restype=result;f.argtypes=args;return f
def gl(name,result,*args):
    pointer=E.eglGetProcAddress(name.encode())
    if not pointer:raise RuntimeError('Missing GL function '+name)
    return C.CFUNCTYPE(result,*args)(pointer)
I=C.c_int;U=C.c_uint;F=C.c_float;P=C.c_void_p
platform=C.CFUNCTYPE(P,U,P,C.POINTER(I))(E.eglGetProcAddress(b'eglGetPlatformDisplayEXT'))
display=platform(0x31DD,None,None)
major,minor=I(),I()
assert egl('eglInitialize',U,[P,C.POINTER(I),C.POINTER(I)])(display,C.byref(major),C.byref(minor))
assert egl('eglBindAPI',U,[U])(0x30A0)
attribs=(I*15)(0x3033,1,0x3040,4,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3025,24,0x3038)
config=P();n=I()
assert egl('eglChooseConfig',U,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(display,attribs,C.byref(config),1,C.byref(n)) and n.value
surface=egl('eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(display,config,(I*5)(0x3057,W,0x3056,H,0x3038))
context=egl('eglCreateContext',P,[P,P,P,C.POINTER(I)])(display,config,None,(I*3)(0x3098,2,0x3038))
assert egl('eglMakeCurrent',U,[P,P,P,P])(display,surface,surface,context)
create_shader=gl('glCreateShader',U,U);source=gl('glShaderSource',None,U,I,C.POINTER(C.c_char_p),C.POINTER(I));compile_shader=gl('glCompileShader',None,U);shader_iv=gl('glGetShaderiv',None,U,U,C.POINTER(I));shader_log=gl('glGetShaderInfoLog',None,U,I,C.POINTER(I),C.c_char_p)
create_program=gl('glCreateProgram',U);attach=gl('glAttachShader',None,U,U);link=gl('glLinkProgram',None,U);program_iv=gl('glGetProgramiv',None,U,U,C.POINTER(I));program_log=gl('glGetProgramInfoLog',None,U,I,C.POINTER(I),C.c_char_p)
use=gl('glUseProgram',None,U);get_uniform=gl('glGetUniformLocation',I,U,C.c_char_p);get_attr=gl('glGetAttribLocation',I,U,C.c_char_p)
uniform1f=gl('glUniform1f',None,I,F);uniform1i=gl('glUniform1i',None,I,I);uniform3=gl('glUniform3fv',None,I,I,C.POINTER(F));uniform4=gl('glUniform4fv',None,I,I,C.POINTER(F));uniform_matrix=gl('glUniformMatrix4fv',None,I,I,C.c_ubyte,C.POINTER(F))
gen_buffers=gl('glGenBuffers',None,I,C.POINTER(U));bind_buffer=gl('glBindBuffer',None,U,U);buffer_data=gl('glBufferData',None,U,C.c_ssize_t,P,U);attr_pointer=gl('glVertexAttribPointer',None,U,I,U,C.c_ubyte,I,P);enable_attr=gl('glEnableVertexAttribArray',None,U);disable_attr=gl('glDisableVertexAttribArray',None,U)
enable=gl('glEnable',None,U);disable=gl('glDisable',None,U);draw=gl('glDrawArrays',None,U,I,I);clear=gl('glClear',None,U)
programs={}
for p in frame['programs']:
    actual=create_program()
    for s in p['shaders']:
        shader=create_shader(s['type']);text=s['src'].encode();ptr=C.c_char_p(text);source(shader,1,C.byref(ptr),None);compile_shader(shader);ok=I();shader_iv(shader,35713,C.byref(ok))
        if not ok.value:
            log=C.create_string_buffer(4096);shader_log(shader,4096,None,log);raise RuntimeError(log.value.decode())
        attach(actual,shader)
    link(actual);ok=I();program_iv(actual,35714,C.byref(ok))
    if not ok.value:
        log=C.create_string_buffer(4096);program_log(actual,4096,None,log);raise RuntimeError(log.value.decode())
    programs[p['id']]=actual

# Reproduce exactly the procedural atlas drawing commands from engine.js.
AW,AH=frame.get('atlasWidth',256),frame.get('atlasHeight',128)
image=Image.new('RGB',(AW,AH),(255,255,255));paint=ImageDraw.Draw(image,'RGBA')
def color(s):
    if s.startswith('#'):return tuple(bytes.fromhex(s[1:]))+(255,)
    values=re.findall(r'[\d.]+',s);return tuple(map(int,values[:3]))+(round(float(values[3])*255),)
for command in frame['atlas']:
    kind,c,*points=command;c=color(c)
    if kind in ('rect','stroke'):
        x,y,w,h=points
        if w<1 or h<1:continue
        bounds=(int(x),int(y),int(x+w-1),int(y+h-1))
        if kind=='rect':paint.rectangle(bounds,fill=c)
        else:paint.rectangle(bounds,outline=c,width=1)
    elif kind=='polygon':paint.polygon([tuple(p) for p in points],fill=c)
    elif kind=='line':paint.line([tuple(p) for p in points],fill=c,width=1)
texture=U();gl('glGenTextures',None,I,C.POINTER(U))(1,C.byref(texture));gl('glBindTexture',None,U,U)(3553,texture.value)
pixels=image.convert('RGBA').tobytes();data=C.create_string_buffer(pixels);gl('glTexImage2D',None,U,I,I,I,I,I,U,U,P)(3553,0,6408,AW,AH,0,6408,5121,data)
parameter=gl('glTexParameteri',None,U,U,I)
for name,value in [(10241,9729),(10240,9729),(10242,33071),(10243,33071)]:parameter(3553,name,value)
buffers={}
for identifier,encoded in frame['buffers'].items():
    actual=U();gen_buffers(1,C.byref(actual));bind_buffer(34962,actual.value);raw=base64.b64decode(encoded);blob=C.create_string_buffer(raw);buffer_data(34962,len(raw),blob,35044);buffers[int(identifier)]=actual.value
gl('glViewport',None,I,I,I,I)(0,0,W,H);gl('glDepthFunc',None,U)(515);gl('glCullFace',None,U)(1029);gl('glClearColor',None,F,F,F,F)(0,0,0,1)
for d in frame['draws']:
    if 'clear' in d:clear(d['clear']);continue
    actual=programs[d['program']];use(actual)
    for cap in (2929,2884):
        (enable if cap in d['enabled'] else disable)(cap)
    for name,value in d['uniforms'].items():
        loc=get_uniform(actual,name.encode())
        if isinstance(value,list):
            array=(F*len(value))(*value)
            if len(value)==16:uniform_matrix(loc,1,0,array)
            elif len(value)==3:uniform3(loc,1,array)
            elif len(value)==4:uniform4(loc,1,array)
        elif name=='uTex':uniform1i(loc,int(value))
        else:uniform1f(loc,value)
    bind_buffer(34962,buffers[d['buffer']])
    for idx in range(8):disable_attr(idx)
    for name,size,offset in [('aPos',3,0),('aUV',2,12),('aColor',4,20),('aNormal',3,36),('aSurface',2,48)]:
        loc=get_attr(actual,name.encode())
        if loc<0:continue
        sky='uDay' in d['uniforms']
        attr_pointer(loc,2 if sky else size,5126,0,0 if sky else frame.get('stride',9)*4,P(offset));enable_attr(loc)
    draw(d['mode'],0,d['count'])
gl('glFinish',None)()
error=gl('glGetError',U)();assert error==0,hex(error)
result=(C.c_ubyte*(W*H*4))();gl('glReadPixels',None,I,I,I,I,U,U,P)(0,0,W,H,6408,5121,result)
output=Image.frombytes('RGBA',(W,H),bytes(result)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB')
output.save(ROOT/'dist/world-preview.png')
output.save(ROOT/'dist'/('preview-'+frame.get('weapon','rifle')+'.png'))
renderer=gl('glGetString',C.c_char_p,U)(7937).decode()
report={'renderer':renderer,'EGL':f'{major.value}.{minor.value}','shaderProgramsCompiled':len(programs),'drawCommands':len(frame['draws']),'glError':error,'resolution':[W,H],'note':'Actual engine frame rendered offscreen; Android WebView/UI still require browser/device checks.'}
(ROOT/'dist/render-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
