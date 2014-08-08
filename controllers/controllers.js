module.exports = {
    functor: function(config, target, lectureModel) {
        return {
            api_controller: require('./api_controller').functor(config, target, lectureModel),
            home_controller: require('./home_controller').functor(config, target, lectureModel)
        };
    }
};
