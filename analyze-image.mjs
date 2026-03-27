import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImage() {
  const zai = await ZAI.create();

  const imageBuffer = fs.readFileSync('/home/z/ai-saas-builder/screenshot-issue.png');
  const base64Image = imageBuffer.toString('base64');

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Décris cette capture d\'écran. Y a-t-il un problème visuel comme un bouton coupé ou un élément mal affiché ?'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }
    ]
  });

  console.log('Analyse:', response.choices[0]?.message?.content);
}

analyzeImage();
