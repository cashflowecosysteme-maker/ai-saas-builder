import ZAI from 'z-ai-web-dev-sdk';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prompts = [
  {
    name: "dashboard-ai.png",
    prompt: "A futuristic glowing digital dashboard interface floating in space with purple and blue neon lights, holographic graphs and charts showing growth, affiliate network visualization with connected nodes, premium tech aesthetic, dark background, cinematic lighting, 8k quality, sleek modern design"
  },
  {
    name: "affiliate-network.png",
    prompt: "Abstract network visualization showing interconnected people nodes in a tree structure, glowing purple and gold connections, 3 levels of network branching outward, dark cosmic background with stars, premium tech style, elegant and professional, cinematic lighting"
  },
  {
    name: "ai-automation.png",
    prompt: "A beautiful AI robot assistant with gentle glowing eyes, working on multiple floating holographic screens showing graphs and analytics, purple and blue ambient lighting, futuristic office setting, warm and friendly atmosphere, high quality digital art, 8k"
  }
];

async function generateImages() {
  try {
    const zai = await ZAI.create();

    for (const image of prompts) {
      console.log(`🎨 Generating: ${image.name}...`);

      const response = await zai.images.generations.create({
        prompt: image.prompt,
        size: '1344x768'
      });

      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');

      const outputPath = join(process.cwd(), 'public', image.name);
      writeFileSync(outputPath, buffer);

      console.log(`✅ Saved: ${outputPath}`);
    }

    console.log('\n🎉 All images generated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateImages();
