exports.comment = function (req, res) {
	var id = req.body.id;
	var comment = req.body.comment;
	var url = '/' + id + '/comments/';
	console.log("url: ", url);
	req.facebook.api(url, 'post', { message : comment}, function (err, data) {
		res.send(!err);		
	})
};