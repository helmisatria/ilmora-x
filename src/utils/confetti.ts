export function runConfetti() {
  const c = document.getElementById("confetti") as HTMLCanvasElement | null;
  if (!c) return;
  
  const x = c.getContext("2d");
  if (!x) return;
  
  c.width = window.innerWidth;
  c.height = window.innerHeight;

  const p = Array.from({ length: 140 }, () => ({
    x: Math.random() * c.width,
    y: Math.random() * -c.height,
    r: Math.random() * 5 + 3,
    co: `hsl(${Math.random() * 360}, 90%, 60%)`,
    s: Math.random() * 2.5 + 1.5,
    a: Math.random() * Math.PI,
  }));

  let f = 0;
  
  function anim() {
    if (!x || !c) return;
    x.clearRect(0, 0, c.width, c.height);
    
    p.forEach((o) => {
      o.y += o.s;
      o.x += Math.sin(f / 20 + o.a) * 0.7;
      if (o.y > c.height) o.y = -10;
      x.fillStyle = o.co;
      x.beginPath();
      x.arc(o.x, o.y, o.r, 0, 6.28);
      x.fill();
    });
    
    f++;
    if (f < 320) requestAnimationFrame(anim);
  }
  
  anim();
}
