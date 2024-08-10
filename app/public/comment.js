function createCommentElement(comment){
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-container';

    const textElement = document.createElement('span');
    textElement.textContent = `${comment.poster_id}: ${comment.body}`;
    textElement.className = 'comment-text';

    const dateElement = document.createElement('span');
    const date = new Date(comment.created_at);
    const formattedDate = date.toLocaleString();

    dateElement.textContent = ` (Posted on ${formattedDate})`;
    dateElement.className = 'comment-time';

    commentElement.appendChild(textElement);
    commentElement.appendChild(dateElement);

    return commentElement;
}

async function fetchComments(eventId){
    try {
        if(!eventId){
            throw Error('No event ID found');
        }
        const response = await fetch(`/events/${eventId}/comments`);

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

async function postComment(eventId, commentText){
    try {

        if(!eventId){
            throw Error("No event ID found");
        }
        const response = await fetch(`/events/${eventId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                body: commentText,
                created_at: new Date().toISOString()
            })
        });

        if(!response.ok){
            throw Error('An unexpected error occured');
        }

        const comment = await response.json();
        const commentList = document.querySelector(`.comments-list-${eventId}`);
        
        if(commentList){
            commentList.appendChild(createCommentElement(comment));
        }

    } catch (err) {
        console.error("Error posting comment:", err);
    }
}