function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    
    const commentBody = document.createElement('p');
    commentBody.textContent = `${comment.poster_id}: ${comment.body}`;
    commentElement.appendChild(commentBody);
    
    const commentDate = document.createElement('small');
    commentDate.textContent = new Date(comment.created_at).toLocaleString();
    commentElement.appendChild(commentDate);
    
    return commentElement;
}

async function fetchComments(eventId){
    try {
        if(!eventId){
            throw Error('No event ID found');
        }
        const response = await fetch(`/api/events/${eventId}/comments`);

        if(!response.ok){
            throw Error('Failed to fetch comments');
        }
        
        const comments = await response.json();
        const commentList = document.querySelector(`.comments-list-${eventId}`);

        if(commentList){
            comments.forEach(comment => {
                commentList.appendChild(createCommentElement(comment));
            });
        }
    } catch (err) {
        console.error('Error fetching comments: ', err);
    }
}


async function postComment(eventId, commentText) {
    try {
        if (!eventId) {
            throw new Error("No event ID found");
        }
        
        console.log("Attempting to post notification...");

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
        const response = await fetch(`/api/events/${eventId}/comments`, {
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

        const comment = await response.json();
        const commentList = document.querySelector(`.comments-list-${eventId}`);
        
        if (commentList) {
            commentList.appendChild(createCommentElement(comment));
        } else {
            console.error(`Comment list for event ${eventId} not found`);
        }

    } catch (err) {
        console.error("Error posting comment:", err);
    }
}
