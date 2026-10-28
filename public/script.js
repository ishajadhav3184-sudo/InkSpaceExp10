const postList = document.getElementById("postList");
const postForm = document.getElementById("postForm");
const message = document.getElementById("message");

async function loadPosts() {
    try {
        const response = await fetch("/api/posts");
        const posts = await response.json();

        if (!response.ok) {
            throw new Error(posts.message || "Could not load stories.");
        }

        if (!Array.isArray(posts) || posts.length === 0) {
            postList.innerHTML =
                '<p class="text-secondary">No stories yet. Be the first to write one!</p>';
            return;
        }

        postList.innerHTML = posts.map(post => `
            <article class="post-card">
                <span class="post-category">✦ COMMUNITY STORY</span>
                <h3 class="mt-3">${escapeHTML(post.title)}</h3>
                <p class="small text-secondary">
                    By ${escapeHTML(post.author)} · ${escapeHTML(post.date)}
                </p>
                <p class="post-content">${escapeHTML(post.content)}</p>
                <button class="delete-btn" data-id="${escapeHTML(post.id)}" type="button">
                    Delete story
                </button>
            </article>
        `).join("");

        postList.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", () => deletePost(button.dataset.id));
        });
    } catch (error) {
        message.textContent = error.message || "Unable to load stories. Please try again.";
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

postForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    message.textContent = "";

    const post = {
        title: document.getElementById("title").value.trim(),
        author: document.getElementById("author").value.trim(),
        content: document.getElementById("content").value.trim()
    };

    if (!post.title || !post.author || !post.content) {
        message.textContent = "Please fill in all fields.";
        return;
    }

    try {
        const response = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(post)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to publish story.");
        }

        postForm.reset();
        message.textContent = "Your story has been published!";
        await loadPosts();
    } catch (error) {
        message.textContent = error.message || "Unable to publish story.";
    }
});

async function deletePost(id) {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
        const response = await fetch("/api/posts/" + encodeURIComponent(id), {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to delete the story.");
        }

        message.textContent = "Story deleted.";
        await loadPosts();
    } catch (error) {
        message.textContent = error.message || "Unable to delete the story.";
    }
}

loadPosts();
