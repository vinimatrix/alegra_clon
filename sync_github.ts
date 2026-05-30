import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const repo = "vinimatrix/alegra_clon";
const token = process.env.GITHUB_TOKEN || ""; // Retrieve from GITHUB_TOKEN env variable if set

async function downloadAndExtract(branch: string = "main"): Promise<boolean> {
  const url = `https://api.github.com/repos/${repo}/zipball/${branch}`;
  console.log(`Attempting to download zipball for branch: ${branch}...`);
  console.log(`URL: ${url}`);

  const headers: Record<string, string> = {
    'User-Agent': 'Alegra_Clon-Sync-Agent'
  };

  if (token) {
    console.log("Using provided GITHUB_TOKEN for authentication.");
    headers['Authorization'] = `token ${token}`;
  } else {
    console.log("No GITHUB_TOKEN specified. Attempting public download...");
  }

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`Received status code ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        if (!token) {
          console.error("\n[Error 404] Could not find the repository. Is the repository private? If so, please provide a GitHub Personal Access Token (PAT) or temporarily make the repository public.");
        } else {
          console.error("\n[Error 404] Repository or branch not found. Verify the branch name and your token permissions (contents:read).");
        }
      }
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Downloaded ${buffer.length} bytes successfully.`);
    console.log("Extracting files...");

    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    if (entries.length === 0) {
      console.error("The downloaded zip is empty.");
      return false;
    }

    // Determine the root folder created by GitHub zipballs (usually username-repo-hash)
    const firstEntry = entries[0].entryName;
    const rootDirName = firstEntry.split('/')[0];
    console.log(`Root directory in archive detected: "${rootDirName}"`);

    let extractedCount = 0;
    
    for (const entry of entries) {
      if (entry.isDirectory) continue;

      let relativePath = entry.entryName;
      if (rootDirName && relativePath.startsWith(rootDirName + '/')) {
        relativePath = relativePath.substring(rootDirName.length + 1);
      }

      if (!relativePath) continue;

      // Absolute safeguard for system critical files to prevent breakage
      if (
        relativePath === 'metadata.json' || 
        relativePath === '.env' || 
        relativePath === '.env.example' ||
        relativePath === 'test_git.ts' ||
        relativePath === 'sync_github.ts'
      ) {
        console.log(`- Preservation: Skipping ${relativePath}`);
        continue;
      }

      const destination = path.join(process.cwd(), relativePath);
      const destDir = path.dirname(destination);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.writeFileSync(destination, entry.getData());
      console.log(`- Extracted: ${relativePath}`);
      extractedCount++;
    }

    console.log(`\nSuccessfully updated ${extractedCount} files from GitHub!`);
    return true;
  } catch (error: any) {
    console.error("An error occurred during sync:", error.message || error);
    return false;
  }
}

async function run() {
  // Try main first, fallback to master if main fails
  let success = await downloadAndExtract("main");
  if (!success) {
    console.log("\nTrying fallback to 'master' branch...");
    success = await downloadAndExtract("master");
  }

  if (success) {
    console.log("\n=================================");
    console.log("🚀 Sync completed successfully!");
    console.log("=================================");
  } else {
    console.log("\n=================================");
    console.log("❌ Sync failed. Please check the errors above.");
    console.log("=================================");
    process.exit(1);
  }
}

run();
