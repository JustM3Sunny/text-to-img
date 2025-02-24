const express = require("express");
const { execSync, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SD_DIR = path.join(__dirname, "stable-diffusion-webui");

if (!fs.existsSync(SD_DIR)) {
    console.log("🚀 Cloning Stable Diffusion WebUI...");
    execSync(`git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git ${SD_DIR}`, { stdio: "inherit" });
}

const MODEL_DIR = path.join(SD_DIR, "models/Stable-diffusion");
const MODEL_URL = "https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned.ckpt";
const MODEL_PATH = path.join(MODEL_DIR, "model.ckpt");

if (!fs.existsSync(MODEL_DIR)) fs.mkdirSync(MODEL_DIR, { recursive: true });

if (!fs.existsSync(MODEL_PATH)) {
    console.log("⏳ Downloading Stable Diffusion Model...");
    execSync(`curl -L -o ${MODEL_PATH} ${MODEL_URL}`, { stdio: "inherit" });
}

console.log("📦 Installing Python Dependencies...");
execSync(`cd ${SD_DIR} && pip install -r requirements.txt`, { stdio: "inherit" });

console.log("🚀 Starting Stable Diffusion WebUI...");
exec(`cd ${SD_DIR} && python launch.py --share`, { stdio: "ignore" });

app.use(express.static("public"));
app.use(express.json());

app.post("/generate", async (req, res) => {
    const prompt = req.body.prompt;
    console.log(`🎨 Generating image for prompt: ${prompt}`);

    try {
        const command = `cd stable-diffusion-webui && python scripts/txt2img.py --prompt "${prompt}" --ckpt models/Stable-diffusion/model.ckpt --outdir outputs/`;
        execSync(command, { stdio: "inherit" });

        const files = fs.readdirSync(path.join(SD_DIR, "outputs/"));
        const imageFile = files.reverse().find(file => file.endsWith(".png"));

        if (imageFile) {
            res.json({ image: `/outputs/${imageFile}` });
        } else {
            res.status(500).json({ error: "Image generation failed" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Image generation failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
});
