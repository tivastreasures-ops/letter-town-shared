import bpy, bmesh, sys, json, math, numpy as np
from mathutils import Vector, Matrix
from PIL import Image, ImageDraw, ImageFilter
hand=sys.argv[1]  # left|right
BASE='/home/claude/work/glovesrc/node_modules/@webxr-input-profiles/assets/dist/profiles/generic-hand/'
joints=json.load(open(f'/tmp/joints_{hand}.json')); JI={n:i for i,n in enumerate(joints)}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=BASE+f'{hand}.glb')
m=[o for o in bpy.data.objects if o.type=='MESH' and len(o.data.vertices)>1000][0]
bpy.context.view_layer.objects.active=m
for md in list(m.modifiers): m.modifiers.remove(md)
DORSAL = -1.0 if hand=='left' else 1.0    # x sign of the back of the hand (Blender-converted space)
# smooth + puff
sub=m.modifiers.new('s','SUBSURF'); sub.levels=1; sub.render_levels=1
bpy.ops.object.modifier_apply(modifier='s')
bm=bmesh.new(); bm.from_mesh(m.data); bm.normal_update()
for v in bm.verts: v.co += v.normal*0.0032
bm.normal_update(); bm.to_mesh(m.data); bm.free(); m.data.update()
me=m.data; vg_names={g.index:g.name for g in m.vertex_groups}
# per-vertex joints/weights (top 4)
def vjw(v):
    gs=sorted([(g.weight,vg_names[g.group]) for g in v.groups if vg_names[g.group] in JI], reverse=True)[:4]
    s=sum(w for w,_ in gs) or 1.0
    gs=[(w/s,n) for w,n in gs]+[(0,'wrist')]*(4-len(gs))
    return [JI[n] for _,n in gs],[w for w,_ in gs]
VJ=[vjw(v) for v in me.vertices]
co=np.array([v.co[:] for v in me.vertices])
zmin,zmax=co[:,2].min(),co[:,2].max(); ymin,ymax=co[:,1].min(),co[:,1].max()
# ---------- texture ----------
W=1024; H=1024   # per tile
pad=0.006
def uv_of(p):  # p = (y,z) in blender -> 0..1 tile coords; fingertips at top
    u=(p[0]-(ymin-pad))/((ymax+pad)-(ymin-pad))
    v=(p[1]-(zmin-pad))/((zmax+0.075+pad)-(zmin-pad))  # include cuff height room
    return u,v
tipgroups={'thumb-tip','thumb-phalanx-distal','index-finger-tip','index-finger-phalanx-distal','middle-finger-tip','middle-finger-phalanx-distal','ring-finger-tip','ring-finger-phalanx-distal','pinky-finger-tip','pinky-finger-phalanx-distal'}
def greenness(i):
    js,ws=VJ[i]; return sum(w for j,w in zip(js,ws) if joints[j] in tipgroups)
mp=[]  # polygons
S=2
def px(p):
    u,v=uv_of(p); return (u*W*S,(1-v)*H*S)
def build_tile(sign):
    cream=Image.new('RGB',(W*S,H*S),(246,233,200)); mask=Image.new('L',(W*S,H*S),0); green=Image.new('L',(W*S,H*S),0)
    dm=ImageDraw.Draw(mask); dg=ImageDraw.Draw(green)
    polys=[]
    for f in me.polygons:
        n=f.normal.x*DORSAL
        if (sign>0 and n< -0.15) or (sign<0 and n>=-0.15) and False: pass
        isd = (f.normal.x*DORSAL) >= 0
        if (sign>0)!=isd: continue
        pts=[px(co[i][1:3]) for i in f.vertices]
        g=sum(greenness(i) for i in f.vertices)/len(f.vertices)
        dm.polygon(pts,fill=255); 
        if g>0.5: dg.polygon(pts,fill=255)
    return cream,mask,green
def finish_tile(sign):
    from scipy import ndimage as ndi
    cream,mask,green=build_tile(sign)
    M=np.array(mask)>127; G=np.array(green)>127
    M=ndi.binary_closing(M,iterations=3); G=ndi.binary_opening(ndi.binary_closing(G,iterations=4),iterations=2)
    band=int(0.0035/((ymax+pad)-(ymin-pad))*W*S)
    dist=ndi.distance_transform_edt(M)
    inner=dist>band                       # body inside the pink piping
    gm=G&inner
    arr=np.zeros((H*S,W*S,3),np.uint8); arr[:]=(240,150,190)
    arr[inner]=(247,236,205); arr[gm]=(139,176,52)
    # stitches: dashed line just inside the green/cream boundary
    gd=ndi.distance_transform_edt(gm)      # distance inside green
    cd=ndi.distance_transform_edt(~gm)     # distance outside green
    off=int(0.0022/((ymax+pad)-(ymin-pad))*W*S)
    ring=((gd>0)&(gd<=off+3)&(gd>=off))|((cd>0)&(cd<=off+3)&(cd>=off)&inner)
    yy,xx=np.mgrid[0:H*S,0:W*S]
    dash=(((xx//18)+(yy//18))%2==0)
    st=ring&dash&inner&(dist>band+6)
    arr[st]=(252,248,228)
    img=Image.fromarray(arr)
    return img,None
dimg,der=finish_tile(+1); pimg,per=finish_tile(-1)
# flower decal on the back of the hand: cut the palm area from the art and fit to the metacarpal area
art=Image.open('/mnt/user-data/uploads/Downloads/letter-town-glove_LEFT.png').convert('RGBA')
dec=art.crop((245,318,612,690))
# metacarpal bbox: vertices weighted mostly to metacarpal / wrist
def meta(i):
    js,ws=VJ[i]; return sum(w for j,w in zip(js,ws) if 'metacarpal' in joints[j])
mi=[i for i in range(len(co)) if meta(i)>0.6 and (co[i][0]-0)*DORSAL>=-1]
pts=co[mi][:,1:3]; y0,y1=pts[:,0].min(),pts[:,0].max(); z0,z1=pts[:,1].min(),pts[:,1].max()
# decal box in tile pixels
(ua,va)=uv_of((y0,z1)); (ub,vb)=uv_of((y1,z0))
bx0,by0,bx1,by1=ua*W*S,(1-va)*H*S,ub*W*S,(1-vb)*H*S
w=bx1-bx0; h=by1-by0
dw=int(w*0.80); dh=int(dw*dec.size[1]/dec.size[0]); 
dec=dec.resize((dw,dh),Image.LANCZOS)
cx,cy=(bx0+bx1)/2,(by0+by1)/2+h*0.02
dm_=Image.new('L',dec.size,0); ImageDraw.Draw(dm_).ellipse((dw*0.03,dh*0.03,dw*0.97,dh*0.97),fill=255); dm_=dm_.filter(ImageFilter.GaussianBlur(dw*0.03))
dimg.paste(dec.convert('RGB'),(int(cx-dw/2),int(cy-dh/2)),dm_)
tex=Image.new('RGB',(2*W*S,H*S)); tex.paste(dimg,(0,0)); tex.paste(pimg,(W*S,0))
tex=tex.resize((2048,1024),Image.LANCZOS); tex.save(f'/home/claude/work/glove_tex_{hand}.png')
# ---------- geometry arrays: glove ----------
def to_gltf(p): return (p[0],p[2],-p[1])
P=[];N=[];UV=[];J=[];Wt=[];IDX=[]; KEY={}
me.calc_loop_triangles(); me.update()
for t in me.loop_triangles:
    f=me.polygons[t.polygon_index]; isd=(f.normal.x*DORSAL)>=0
    for vi in t.vertices:
        k=(vi,isd)
        if k not in KEY:
            v=me.vertices[vi]; u,vv=uv_of(co[vi][1:3]); u=(u+(0 if isd else 1))/2
            P.append(to_gltf(co[vi])); N.append(to_gltf(v.normal)); UV.append((u,1-vv)); J.append(VJ[vi][0]); Wt.append(VJ[vi][1]); KEY[k]=len(P)-1
        IDX.append(KEY[k])
glove=dict(P=np.array(P,'f4'),N=np.array(N,'f4'),UV=np.array(UV,'f4'),J=np.array(J,'u2'),W=np.array(Wt,'f4'),I=np.array(IDX,'u4'))
# ---------- cuff + bow ----------
wr=JI['wrist']
top=co[:,2]>zmax-0.010
cx0,cy0=co[top][:,0].mean(),co[top][:,1].mean(); ax=(co[top][:,0].max()-co[top][:,0].min())/2+0.001; ay=(co[top][:,1].max()-co[top][:,1].min())/2+0.001
zb=zmax-0.016; CH=0.058; NT=48; NH=10
def ringpt(j,t):
    th=2*math.pi*j/NT; s=0.90+0.2*min(t/0.25,1.0)+0.7*(t**1.8)
    scal=0.0075*(0.5+0.5*math.cos(8*th))*(1-t)     # scalloped lower edge
    return (cx0+ax*(1.05*s*0.85)*math.cos(th), cy0+ay*(1.12*s)*math.sin(th), zb+CH*t+ (scal if t>0.9 else 0)+(0 if t<0.9 else 0))
def build_cuff():
    Pp=[];Uu=[];Ii=[]
    for i in range(NH+1):
        t=i/NH
        for j in range(NT+1):
            Pp.append(ringpt(j%NT,t)); Uu.append((j/NT*4, 1-t))
    for i in range(NH):
        for j in range(NT):
            a=i*(NT+1)+j; b=a+1; c=a+NT+1; d=c+1
            Ii+= [a,c,b,b,c,d]
    Pp=np.array(Pp); Ii=np.array(Ii).reshape(-1,3)
    # outer-facing winding: flip so normals point outward
    nrm=np.zeros_like(Pp)
    for a,b,c in Ii:
        n=np.cross(Pp[b]-Pp[a],Pp[c]-Pp[a]); nrm[a]+=n; nrm[b]+=n; nrm[c]+=n
    nrm/=np.linalg.norm(nrm,axis=1,keepdims=True)+1e-9
    cen=np.array([cx0,cy0]); rad=Pp[:,:2]-cen
    if (nrm[:,:2]*rad).sum()<0: Ii=Ii[:,[0,2,1]]; nrm=-nrm
    return Pp,nrm,np.array(Uu),Ii.reshape(-1)
cp,cn,cu,ci=build_cuff()
cuff=dict(P=np.array([to_gltf(p) for p in cp],'f4'),N=np.array([to_gltf(n) for n in cn],'f4'),UV=np.array(cu,'f4'),
          J=np.tile(np.array([wr,0,0,0],'u2'),(len(cp),1)),W=np.tile(np.array([1,0,0,0],'f4'),(len(cp),1)),I=ci.astype('u4'))
# bow (blender space) on dorsal side of cuff
bm=bmesh.new()
def add_part(op,mat):
    r=op(); 
    verts=r['verts'] if isinstance(r,dict) else r
    bmesh.ops.transform(bm,matrix=mat,verts=verts)
bowc=Vector((cx0+DORSAL*ax*1.5*1.05, cy0, zb+CH*0.40))
def sph(sx,sy,sz,loc,rot=(0,0,0)):
    res=bmesh.ops.create_uvsphere(bm,u_segments=16,v_segments=10,radius=1.0)
    mat=Matrix.Translation(loc)@Matrix.Rotation(rot[2],4,'Z')@Matrix.Rotation(rot[1],4,'Y')@Matrix.Rotation(rot[0],4,'X')@Matrix.Diagonal((sx,sy,sz,1))
    bmesh.ops.transform(bm,matrix=mat,verts=res['verts'])
# bow axes: wide along y (side to side), height along z, thickness along x (out of the hand)
d=DORSAL
sph(0.007,0.016,0.011,bowc+Vector((d*0.002,0.016,0.008)),(0.5,0,0))
sph(0.007,0.016,0.011,bowc+Vector((d*0.002,-0.016,0.008)),(-0.5,0,0))
sph(0.0065,0.0075,0.007,bowc+Vector((d*0.004,0,0.004)))
sph(0.0035,0.007,0.016,bowc+Vector((d*0.001,0.007,-0.012)),(-0.3,0,0))
sph(0.0035,0.007,0.016,bowc+Vector((d*0.001,-0.007,-0.012)),(0.3,0,0))
bm.normal_update()
bP=[];bN=[];bI=[]
mesh2=bpy.data.meshes.new('bow'); bm.to_mesh(mesh2); bm.free()
mesh2.calc_loop_triangles()
for v in mesh2.vertices: pass
for t in mesh2.loop_triangles:
    for vi in t.vertices:
        v=mesh2.vertices[vi]; bP.append(to_gltf(v.co)); bN.append(to_gltf(v.normal)); bI.append(len(bP)-1)
bow=dict(P=np.array(bP,'f4'),N=np.array(bN,'f4'),UV=np.zeros((len(bP),2),'f4'),J=np.tile(np.array([wr,0,0,0],'u2'),(len(bP),1)),W=np.tile(np.array([1,0,0,0],'f4'),(len(bP),1)),I=np.array(bI,'u4'))
np.savez(f'/home/claude/work/glove_{hand}.npz',**{f'{k}_{kk}':vv for k,d_ in [('glove',glove),('cuff',cuff),('bow',bow)] for kk,vv in d_.items()})
print(hand,'ok',len(glove['P']),len(cuff['P']),len(bow['P']),'dorsal',DORSAL, 'cuff center',cx0,cy0,'ax,ay',ax,ay)
