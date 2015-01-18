ROOT_PATH = __dirname;

function make_config(TARGET) {
    var config = {};

    config.TARGET = TARGET;
    config.ROOT_VIEW_PATH = ROOT_PATH + '/views/' + TARGET;
    config.ROOT_DATA_PATH = ROOT_PATH + '/data/' + TARGET;
    config.IMAGE_PATH = ROOT_PATH + '/assets/images';
    config.USER_IMAGE_PATH = ROOT_PATH + '/userdata/' + TARGET + '/images';
    config.USER_TIMETABLE_PATH = ROOT_PATH + '/userdata/' + TARGET + '/timetables';
    return config;
}

//TODO : This is legacy code for hufstt (neeeds to be removed)
snutt_config = make_config("snutt");

module.exports = {
    ROOT_PATH: ROOT_PATH,
    snutt: snutt_config,
}
