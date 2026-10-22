import sharp from 'sharp';
import {access} from 'node:fs/promises';
// Bounds inspected in Chrome at the installed app's default 1000x760 window.
// Crop only the genuine app content, excluding account details and Anna's dock.
for(const [source,target] of [['installed-ready','01-ready'],['installed-question','02-question'],['installed-guess','03-guess'],['installed-result','04-result']]) {
  const input=`output/${source}.png`;try{await access(input);}catch{continue;}
  await sharp(input).extract({left:600,top:80,width:960,height:640}).png().toFile(`listing-assets/${target}.png`);
  console.log(`Prepared ${target}.png from genuine installed app screenshot.`);
}
