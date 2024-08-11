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