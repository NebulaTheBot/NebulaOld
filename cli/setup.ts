import * as fs from "fs";
import { createInterface } from "readline";

const readHiddenInput = async (prompt: string): Promise<string> => {
  console.log(prompt);

  return new Promise(resolve => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const stdin = process.stdin;
    if (stdin.isTTY) stdin.setRawMode(true);

    stdin.on("data", data => {
      if (data.toString() === "\n" || data.toString() === "\r") {
        if (stdin.isTTY) stdin.setRawMode(false);
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
        rl.close();
      }
    });

    rl.question("", input => {
      resolve(input);
    });
  });
};

const replaceTokenInEnv = (token: string) => {
  try {
    const envContent = fs.readFileSync(".env", "utf-8");
    const updatedContent = envContent.replace("YOURTOKEN", token);
    fs.writeFileSync(".env", updatedContent, "utf-8");
    console.log("You're good to go, happy coding!");
  } catch (error) {
    console.error("Error updating .env file:", error);
  }
};

const main = async () => {
  fs.copyFileSync("example.env", ".env");
  const token = await readHiddenInput(
    "Paste your token below: (you can get one from https://discord.com/developers/applications)"
  );
  replaceTokenInEnv(token);
};

main().catch(console.error);
