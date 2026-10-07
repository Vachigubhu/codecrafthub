const express = require("express");
const crypto = require("crypto");
const { getCourses, saveCourses } = require("../storage/courseStore");

const router = express.Router();

const allowedStatuses = ["Not Started", "In Progress", "Completed"];

function isValidDate(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateCourseFields(body, partial = false) {
  const errors = [];

  if (!partial || body.name !== undefined) {
    if (!body.name || typeof body.name !== "string") {
      errors.push("name is required and must be a string");
    }
  }

  if (body.description !== undefined && typeof body.description !== "string") {
    errors.push("description must be a string");
  }

  if (
    body.targetCompletionDate !== undefined &&
    !isValidDate(body.targetCompletionDate)
  ) {
    errors.push("targetCompletionDate must use YYYY-MM-DD format");
  }

  if (body.status !== undefined && !allowedStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}`);
  }

  return errors;
}

router.get("/", async (req, res) => {
  try {
    let courses = await getCourses();

    if (req.query.status) {
      courses = courses.filter((course) => course.status === req.query.status);
    }

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const courses = await getCourses();

    const course = courses.find((course) => course.id === req.params.id);

    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const errors = validateCourseFields(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const courses = await getCourses();

    const newCourse = {
      id: crypto.randomUUID(),
      name: req.body.name,
      description: req.body.description || "",
      targetCompletionDate: req.body.targetCompletionDate || null,
      status: req.body.status || "Not Started",
      createdAt: new Date().toISOString(),
    };

    courses.push(newCourse);
    await saveCourses(courses);

    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const errors = validateCourseFields(req.body, true);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const courses = await getCourses();

    const course = courses.find((course) => course.id === req.params.id);

    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "targetCompletionDate",
      "status",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    }

    await saveCourses(courses);

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const courses = await getCourses();

    const course = courses.find((course) => course.id === req.params.id);

    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    course.status = status;

    await saveCourses(courses);

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const courses = await getCourses();

    const courseIndex = courses.findIndex(
      (course) => course.id === req.params.id,
    );

    if (courseIndex === -1) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    const deletedCourse = courses.splice(courseIndex, 1)[0];

    await saveCourses(courses);

    res.json({
      message: "Course deleted successfully",
      course: deletedCourse,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
