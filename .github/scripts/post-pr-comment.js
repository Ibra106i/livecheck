#!/usr/bin/env node

/**
 * Post or update a Livecheck audit comment on a GitHub PR.
 *
 * Usage:
 *   node post-pr-comment.js
 *
 * Environment variables:
 *   GITHUB_TOKEN          - GitHub token with repo access
 *   GITHUB_EVENT_PATH     - Path to the GitHub event JSON file
 *   LIVECHECK_MARKDOWN    - Markdown content for the comment
 *   LIVECHECK_SCORE       - Audit score (for title)
 *   LIVECHECK_PASS        - Whether all checks passed (for title)
 */

const fs = require('fs');
const https = require('https');

const MARKER = '<!-- livecheck -->';

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const markdown = process.env.LIVECHECK_MARKDOWN;
  const score = process.env.LIVECHECK_SCORE;
  const pass = process.env.LIVECHECK_PASS;

  if (!token) {
    console.log('No GITHUB_TOKEN provided, skipping comment.');
    process.exit(0);
  }

  if (!eventPath || !fs.existsSync(eventPath)) {
    console.log('No event file found, skipping comment.');
    process.exit(0);
  }

  if (!markdown) {
    console.log('No markdown content provided, skipping comment.');
    process.exit(0);
  }

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const prNumber = event.pull_request?.number;

  if (!prNumber) {
    console.log('Not a pull request event, skipping comment.');
    process.exit(0);
  }

  const repoSlug = process.env.GITHUB_REPOSITORY;
  if (!repoSlug) {
    console.log('No GITHUB_REPOSITORY found, skipping comment.');
    process.exit(0);
  }

  const [owner, repo] = repoSlug.split('/');

  // Build the full comment body
  const statusEmoji = pass === 'true' ? '✅' : '❌';
  const statusText = pass === 'true' ? 'Passed' : 'Failed';
  const title = `## ${statusEmoji} Livecheck — Score: ${score || '?'}/100 (${statusText})`;

  const body = `${MARKER}
${title}

${markdown}

<sub>📖 [Full documentation](https://github.com/Ibra106i/livecheck) · 🐛 [Report issues](https://github.com/Ibra106i/livecheck/issues)</sub>`;

  // Find existing comment to update
  const existingCommentId = await findExistingComment(owner, repo, prNumber, token);

  if (existingCommentId) {
    await updateComment(owner, repo, existingCommentId, body, token);
    console.log(`Updated existing comment #${existingCommentId}`);
  } else {
    const newComment = await createComment(owner, repo, prNumber, body, token);
    console.log(`Created new comment #${newComment.id}`);
  }
}

async function findExistingComment(owner, repo, prNumber, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100`;

  try {
    const data = await apiRequest('GET', url, null, token);
    for (const comment of data) {
      if (comment.body && comment.body.includes(MARKER)) {
        return comment.id;
      }
    }
  } catch (err) {
    console.warn('Warning: Could not search for existing comment:', err.message);
  }

  return null;
}

async function createComment(owner, repo, prNumber, body, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
  return apiRequest('POST', url, { body }, token);
}

async function updateComment(owner, repo, commentId, body, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`;
  return apiRequest('PATCH', url, { body }, token);
}

function apiRequest(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'livecheck-action',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

main().catch((err) => {
  console.error('Error posting comment:', err.message);
  process.exit(0); // Don't fail the workflow over a comment
});
