const fs = require("fs").promises;
const path = require("path");

const dataDirectory = path.join(__dirname, "../../data");
const dataFile = path.join(dataDirectory, "course.json");

async function ensureDataFile() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf8");
  }
}

async function getCourses() {
  await ensureDataFile();

  const fileContents = await fs.readFile(dataFile, "utf8");

  try {
    return JSON.parse(fileContents);
  } catch {
    throw new Error("Course JSON file contains invalid JSON");
  }
}

async function saveCourses(courses) {
  await ensureDataFile();

  const temporaryFile = `${dataFile}.tmp`;

  await fs.writeFile(temporaryFile, JSON.stringify(courses, null, 2), "utf8");

  await fs.rename(temporaryFile, dataFile);
}

module.exports = {
  getCourses,
  saveCourses,
};
