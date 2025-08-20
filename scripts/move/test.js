const { execSync } = require("child_process");

const test = () => {
  // Use explicit test address for testing
  const command = `aptos move test --named-addresses todolist_addr=0x100`;

  console.log("Running Move tests...");
  try {
    const result = execSync(command, {
      encoding: "utf-8",
      cwd: "contract",
      stdio: "inherit",
    });
    console.log("Tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
};

test();
