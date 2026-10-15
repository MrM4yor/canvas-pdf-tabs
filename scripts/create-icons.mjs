import {readFile,writeFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const image=await loadImage(await readFile(new URL('../assets/icon.svg',import.meta.url)));
for(const size of [16,32,48,128]){
  const canvas=createCanvas(size,size);canvas.getContext('2d').drawImage(image,0,0,size,size);
  await writeFile(new URL(`../assets/icon-${size}.png`,import.meta.url),canvas.toBuffer('image/png'));
}
