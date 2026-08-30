#!/usr/bin/env python3
"""Generate the full Parkinson Companion icon set from one vector definition.

Run from the repo root:  python3 tools/make-icons.py

The mark is an original stylised tulip - the international symbol of
Parkinson's disease. It is NOT traced from any charity's logo (Parkinson's UK,
the EPDA and others hold trademarks on their own tulip marks), and it avoids a
red cross, which is a protected emblem under the Geneva Conventions.
"""
from PIL import Image, ImageDraw
SS=4; RED=(192,57,43); WHITE=(255,255,255)

def quad(p0,p1,p2,n=60):
    return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0],
             (1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1])
            for t in (i/n for i in range(n+1))]
def cubic(p0,p1,p2,p3,n=60):
    return [((1-t)**3*p0[0]+3*(1-t)**2*t*p1[0]+3*(1-t)*t*t*p2[0]+t**3*p3[0],
             (1-t)**3*p0[1]+3*(1-t)**2*t*p1[1]+3*(1-t)*t*t*p2[1]+t**3*p3[1])
            for t in (i/n for i in range(n+1))]

# Tulip in normalised units: x centred on 0, y downward from the petal tips.
# The three lobes are cut into the TOP edge only; the outer silhouette is one
# continuous curve from left tip, around the cup, to right tip - so the petals
# flow into the cup instead of meeting it at a corner.
L=(-0.66,0.20); V1=(-0.20,0.38); C=(0.0,0.02); V2=(0.20,0.38); R=(0.66,0.20)
BLOOM=( quad(L,(-0.50,0.19),V1) + quad(V1,(-0.10,0.09),C)
      + quad(C,(0.10,0.09),V2)  + quad(V2,(0.50,0.19),R)
      + cubic(R,(0.71,0.60),(0.60,0.90),(0.40,0.97))
      + cubic((0.40,0.97),(0.18,1.06),(-0.18,1.06),(-0.40,0.97))
      + cubic((-0.40,0.97),(-0.60,0.90),(-0.71,0.60),L) )

def leaf(sign):
    """A pointed leaf sweeping outward from the stem, clear of it."""
    base=(sign*0.05,1.60); tip=(sign*0.56,1.06)
    return (quad(base,(sign*0.15,1.10),tip) + quad(tip,(sign*0.38,1.48),base))

def figure(S, scale):
    m=Image.new('L',(S,S),0); d=ImageDraw.Draw(m)
    H=1.80                                  # total height in units
    u=(0.66*scale*S)/H                      # unit length
    cx=S/2; top=(S-H*u)/2
    def P(pts): return [(cx+x*u, top+y*u) for x,y in pts]
    d.polygon(P(BLOOM),fill=255)
    d.rounded_rectangle((cx-0.075*u, top+0.92*u, cx+0.075*u, top+1.64*u),
                        radius=0.075*u, fill=255)          # stem
    d.polygon(P(leaf(-1)),fill=255); d.polygon(P(leaf(1)),fill=255)
    return m

def render(size,*,rounded,scale=1.0,alpha):
    S=size*SS
    bg=Image.new('RGBA',(S,S),RED+(255,))
    if rounded:
        c=Image.new('L',(S,S),0)
        ImageDraw.Draw(c).rounded_rectangle((0,0,S-1,S-1),radius=int(S*0.22),fill=255)
        bg.putalpha(c)
    bg.paste(Image.new('RGBA',(S,S),WHITE+(255,)),(0,0),figure(S,scale))
    out=bg.resize((size,size),Image.LANCZOS)
    if not alpha:
        f=Image.new('RGB',(size,size),RED); f.paste(out,(0,0),out); return f
    return out

render(192, rounded=True,  alpha=True ).save('icon-192.png')
render(512, rounded=True,  alpha=True ).save('icon-512.png')
render(512, rounded=False, scale=0.80, alpha=True ).save('icon-maskable-512.png')
render(1024,rounded=False, alpha=False).save('icon-1024.png')
render(180, rounded=True,  alpha=True ).save('apple-touch-180.png')  # inline into index.html
print("rendered")
