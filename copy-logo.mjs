import fs from 'node:fs';
import path from 'node:path';

const src = 'C:/Users/Tomas/.gemini/antigravity/brain/c5666b13-70d5-4ccc-bef6-809c37cd219a/.user_uploaded/media_1793197438152_ac5d693b.png';
const dst = path.resolve('logo-insece-oficial.png');
fs.copyFileSync(src, dst);

// Also copy to models/
const dstModels = path.resolve('extracted-3d-lib/models/logo-insece-oficial.png');
fs.copyFileSync(src, dstModels);

console.log('SUCCESS, copied to:', dst, 'and', dstModels);
