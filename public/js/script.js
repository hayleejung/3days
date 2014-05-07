$(function(){
	$('.animated').autosize();
});


// ----------------------------------- comment ajax

$(document).ready(function(){

	$('.like-post').click(function(e){
		var postId = $(this).data('thread-id');
		var url = '/like';
		$.post(url, {postId: postId}, function(response){
			console.log(response);
		});
	});

	$('.more-comments').click(function(e){
		// Flush all commentsboxes
		var allCommentsBoxes = document.getElementsByClassName('commentsbox');
		for(var i = 0; i < allCommentsBoxes.length; i++) {
			allCommentsBoxes[i].innerHTML = '';
		}

		var comments;
		var threadId = $(this).data('thread-id');
		var url = '/commentJSON/' + threadId;
		$.get(url, function(result){
			// var comments = document.getElementById('commentajax');
			// var comments = document.querySelector('[eyedee="'+threadId+'"]')
			comments = document.getElementById(threadId);
			comments.innerHTML = '';
			for(var i = 0; i < result.comments.length; i++) {
				var comment = document.createElement('div');
				comment.setAttribute('class', 'commentbox');
				comment.innerHTML = '<div class="commentleft">'+result.comments[i]+
					'</div><div class="commentright">'+'3d'+'</div>  \
					<div class="clearfix visible-xs"></div>';
				comments.appendChild(comment);
			}

			var newcomment = document.createElement('div');
			newcomment.setAttribute('class', 'newcommentbox');
			comments.appendChild(newcomment);

			// var textbox = document.createElement('input');
			// textbox.setAttribute('type', 'text');
			// comments.appendChild(textbox);

			var commenthere = document.createElement('div');
			commenthere.setAttribute('class', 'commentinview');
			commenthere.innerHTML = '<form action="/commentJSON/'+ result.id+ '"method="POST">	\
			<input type="hidden" name="id" value="'+ result.id+'" />  \
			<input type="hidden" name="groupid" value="'+ result.groupID+'" />  \
			<input type="text" class="commentinputbox" id="commentinput" name="comment" size="40" placeholder="Comment Here" />  \
			<button type="summit" class="commentsummit"> Comment </button> </form>'
				comments.appendChild(commenthere);

			$('.commentsummit').click(function(e){
				newcomment.innerHTML = '<div class="commentbox"><div class="commentleft">'+ document.getElementById('commentinput').value+'</div>  \
				<div class="commentright">'+'now'+'</div> \
					<div class="clearfix visible-xs"></div></div>';
			});
		});

		

		e.preventDefault();
	});
});
