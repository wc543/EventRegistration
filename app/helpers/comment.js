async function fetchComments(eventId) {
    try {
        if (!eventId) {
            throw new Error('No event ID found');
        }

        const response = await fetch(`/api/comments/${eventId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }

        const comments = await response.json();
        const commentList = document.querySelector(`.comments-list-${eventId}`);

        if (commentList) {
            for (const comment of comments) {
                // Fetch the user details
                const userResponse = await fetch(`/api/account/user/${comment.poster_id}`);

                if (!userResponse.ok) {
                    throw new Error(`Failed to fetch user with ID ${comment.poster_id}`);
                }

                const val = await userResponse.json();
                console.log(val.user);
                const username = val.user.username;
                console.log("comment, ", comment);

                // Create a comment element with the username instead of user ID
                commentList.appendChild(createCommentElement(comment, username));
            }
        }
    } catch (err) {
        console.error('Error fetching comments: ', err);
    }
}

function createCommentElement(comment, username) {
    console.log(comment, username);
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';

    commentElement.innerHTML = `
        <p><strong>${username}</strong>: ${comment.body}</p>
        <p><em>${new Date(comment.created_at).toLocaleString()}</em></p>
    `;

    return commentElement;
}






async function postComment(eventId, commentText) {
    try {
        if (!eventId) {
            throw new Error("No event ID found");
        }
        
        console.log("Attempting to post notification...");


        let usernameResponse = await fetch(`/api/account/username`, {
            method: 'GET'
        });
        let usernameBody = await usernameResponse.json();
        let username = usernameBody.username;

        // Post notification
        const notificationResponse = await fetch(`/api/notifications/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Add Content-Type header
                'session_key': 'ssKey' // Ensure this header is needed or correct
            },
            body: JSON.stringify({
                event_id: eventId,
                body: "You have received a new comment",
                created_at: new Date().toISOString()
            })
        });

        if (!notificationResponse.ok) {
            throw new Error('Failed to post notification');
        }
        
        console.log("Notification posted successfully");

        // Post comment
        const response = await fetch(`/api/comments/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                body: commentText,
                created_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to post comment');
        }

        console.log("Comment posted successfully");

        await response.json();

        // Create a new comment element
        const commentList = document.querySelector(`.comments-list-${eventId}`);
        
        if(commentList){
            // Append the new comment to the list immediately
            const commentElement = createCommentElement({
                body: commentText,
                created_at: new Date().toISOString()
            }, username);
            commentList.appendChild(commentElement);
        }

    } catch (err) {
        console.error("Error posting comment:", err);
    }
}
