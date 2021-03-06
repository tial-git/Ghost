/**
 * Main controller for Ghost frontend
 */

/*global require, module */

var debug = require('debug')('ghost:channels:single'),
    api         = require('../../api'),
    utils       = require('../../utils'),
    filters     = require('../../filters'),
    templates   = require('./templates'),
    handleError = require('./error'),
    formatResponse = require('./format-response'),
    postLookup     = require('./post-lookup'),
    setResponseContext = require('./context'),
    setRequestIsSecure = require('./secure'),

    frontendControllers;

/*
* Sets the response context around a post and renders it
* with the current theme's post view. Used by post preview
* and single post methods.
* Returns a function that takes the post to be rendered.
*/
function renderPost(req, res) {
    debug('renderPost called');
    return function renderPost(post) {
        var view = templates.single(req.app.get('activeTheme'), post),
            response = formatResponse.single(post);

        setResponseContext(req, res, response);
        debug('Rendering view: ' + view);
        res.render(view, response);
    };
}

frontendControllers = {
    preview: function preview(req, res, next) {
        var params = {
                uuid: req.params.uuid,
                status: 'all',
                include: 'author,tags'
            };

        api.posts.read(params).then(function then(result) {
            var post = result.posts[0];

            if (!post) {
                return next();
            }

            if (post.status === 'published') {
                return res.redirect(301, utils.url.urlFor('post', {post: post}));
            }

            setRequestIsSecure(req, post);

            filters.doFilter('prePostsRender', post, res.locals)
                .then(renderPost(req, res));
        }).catch(handleError(next));
    },
    single: function single(req, res, next) {
        // Query database to find post
        return postLookup(req.path).then(function then(lookup) {
            var post = lookup ? lookup.post : false;

            if (!post) {
                return next();
            }

            // CASE: last param is of url is /edit, redirect to admin
            if (lookup.isEditURL) {
                return res.redirect(utils.url.urlJoin(utils.url.getSubdir(), '/ghost/editor', post.id, '/'));
            }

            // CASE: permalink is not valid anymore, we redirect him permanently to the correct one
            if (post.url !== req.path) {
                return res.redirect(301, post.url);
            }

            setRequestIsSecure(req, post);

            filters.doFilter('prePostsRender', post, res.locals)
                .then(renderPost(req, res));
        }).catch(handleError(next));
    }
};

module.exports = frontendControllers;
