// scripts/course-listing.js

// This object holds static course information (like introduction text)
// and acts as a fallback if GitHub fetch fails.
const courseStaticData = {
    python: {
        title: "Python Programming",
        intro: "Dive into the versatile world of Python! This course covers everything from fundamental concepts to advanced topics like web development, data science, and automation. Python is an essential skill for any modern developer."
    },
    flutter: {
        title: "Flutter Mobile & Web Development",
        intro: "Learn to build beautiful, natively compiled applications for mobile, web, and desktop from a single codebase using Google's Flutter framework. This course will take you from zero to a complete cross-platform app developer."
    },
    c: {
        title: "C Programming Fundamentals",
        intro: "Master the foundational language of systems programming. This course provides a deep dive into C, covering memory management, pointers, data structures, and algorithms, essential for understanding how software interacts with hardware."
    }
};

/**
 * Dynamically fetches file names from a GitHub directory and generates buttons.
 * @param {string} courseId - The ID of the course (e.g., 'python', 'flutter', 'c').
 * @param {string} contentContainerId - The ID of the HTML element where buttons will be added.
 * @param {string} introTextId - The ID of the HTML element for the introduction text.
 * @param {string} githubRepoPath - The path to the GitHub directory (e.g., 'YOUR_USERNAME/YOUR_REPO_NAME/contents/courses/python/contents').
 * Ensure this is the API path, not the raw URL.
 */
async function generateCourseContentLayout(courseId, contentContainerId, introTextId, githubRepoPath) {
    const contentContainer = document.getElementById(contentContainerId);
    const introTextElement = document.getElementById(introTextId);
    let courseInfo = courseStaticData[courseId];

    // Set introduction text immediately from static data
    if (introTextElement && courseInfo) {
        introTextElement.textContent = courseInfo.intro;
    } else if (introTextElement) {
        introTextElement.textContent = "Loading course introduction...";
    }

    // Show loading message
    if (contentContainer) {
        contentContainer.innerHTML = '<p class="loading-message">Fetching course content from GitHub...</p>';
    }

    try {
        const apiUrl = `https://api.github.com/repos/${githubRepoPath}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const githubFiles = await response.json();

        // Filter for files (not directories) and sort them by name
        const lessonFiles = githubFiles
            .filter(item => item.type === 'file' && item.name.endsWith('.html'))
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically/numerically

        if (lessonFiles.length === 0) {
            if (contentContainer) {
                contentContainer.innerHTML = '<p class="error-message">No HTML lesson files found in this directory.</p>';
            }
            return;
        }

        // Store the fetched files globally for potential "Next/Previous" button logic on lesson pages
        window.currentCourseLessons = lessonFiles;
        window.currentCourseId = courseId; // Store current course ID too

        // Clear loading message
        if (contentContainer) {
            contentContainer.innerHTML = '';

            lessonFiles.forEach(item => {
                const buttonWrapper = document.createElement('div');
                buttonWrapper.classList.add('content-button-wrapper');
                
                const button = document.createElement('a');
                // The href points to the actual HTML file inside the 'contents' folder
                // Relative path from the current course's index.html to its contents folder
                button.href = `./contents/${item.name}`; // item.name is already the full filename from GitHub
                button.classList.add('content-button');
                
                // Clean the text for the button: remove .html, replace hyphens, capitalize words
                const buttonText = item.name
                                    .replace(/\.html$/, '') // Remove .html extension
                                    .replace(/-/g, ' ')     // Replace hyphens with spaces
                                    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
                button.textContent = buttonText;
                
                buttonWrapper.appendChild(button);
                contentContainer.appendChild(buttonWrapper);
            });
        }

    } catch (error) {
        console.error("Failed to fetch course content from GitHub:", error);
        if (contentContainer) {
            contentContainer.innerHTML = `<p class="error-message">Error loading content: ${error.message}. Please ensure the GitHub path is correct and public.</p>`;
        }
        if (introTextElement && !introTextElement.textContent) { // If intro wasn't set by static data
            introTextElement.textContent = "Failed to load course introduction.";
        }
    }
}

/**
 * Function to set up navigation for individual lesson pages.
 * This function would be called from each lesson's HTML file.
 * @param {string} courseId - The ID of the course.
 * @param {string} currentLessonFileName - The filename of the current lesson (e.g., "01 - Intro.html").
 * @param {string} prevButtonId - The ID of the 'Previous Lesson' button element.
 * @param {string} nextButtonId - The ID of the 'Next Lesson' button element.
 * @param {string} githubRepoPath - The base GitHub API path for the course's contents folder.
 */
async function setupLessonNavigation(courseId, currentLessonFileName, prevButtonId, nextButtonId, githubRepoPath) {
    const prevButton = document.getElementById(prevButtonId);
    const nextButton = document.getElementById(nextButtonId);
    
    // Hide buttons by default
    if (prevButton) prevButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'none';

    let lessonFiles = window.currentCourseLessons; // Try to use globally stored list

    // If list not available (e.g., direct page access), fetch it
    // Or if the course ID in global scope doesn't match, re-fetch.
    if (!lessonFiles || window.currentCourseId !== courseId) {
        try {
            const apiUrl = `https://api.github.com/repos/${githubRepoPath}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const githubFiles = await response.json();
            lessonFiles = githubFiles
                .filter(item => item.type === 'file' && item.name.endsWith('.html'))
                .sort((a, b) => a.name.localeCompare(b.name));
            window.currentCourseLessons = lessonFiles; // Store for future use
            window.currentCourseId = courseId;
        } catch (error) {
            console.error("Failed to fetch lesson list for navigation:", error);
            // Don't display buttons if list cannot be fetched
            return; 
        }
    }

    const currentIndex = lessonFiles.findIndex(item => item.name === currentLessonFileName);

    // Setup Previous Button
    if (prevButton && currentIndex > 0) {
        const prevLesson = lessonFiles[currentIndex - 1];
        prevButton.href = `./${prevLesson.name}`; // Relative path to the previous lesson
        prevButton.style.display = 'inline-block'; // Show the button
    }

    // Setup Next Button
    if (nextButton && currentIndex !== -1 && currentIndex < lessonFiles.length - 1) {
        const nextLesson = lessonFiles[currentIndex + 1];
        nextButton.href = `./${nextLesson.name}`; // Relative path to the next lesson
        nextButton.style.display = 'inline-block'; // Show the button
    }
}
