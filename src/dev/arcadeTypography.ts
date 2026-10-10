/** Native sans-serif text, rendered locally; the legacy bitmap font remains available. */
export const ARCADE_FONT='system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
export function measureText(ctx:CanvasRenderingContext2D,text:string,pixel:number):number {
  ctx.save();ctx.font=`700 ${9*pixel}px ${ARCADE_FONT}`
  const width=ctx.measureText(text).width;ctx.restore();return width
}
export function drawTextShadowed(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,pixel:number,color:string,shadow='#090d18'):void {
  ctx.save();ctx.font=`700 ${9*pixel}px ${ARCADE_FONT}`;ctx.textAlign='left';ctx.textBaseline='alphabetic'
  const metrics=ctx.measureText(text)
  ctx.shadowColor=shadow;ctx.shadowBlur=pixel*0.5;ctx.shadowOffsetY=pixel*0.35
  ctx.fillStyle=color;ctx.fillText(text,x,y+(metrics.actualBoundingBoxAscent||7*pixel))
  ctx.restore()
}
