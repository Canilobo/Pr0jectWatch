// ==UserScript==
// @name        Project Watch - File 4
// @icon 		https://bs.to/opengraph.jpg
// @namespace   https://bs.to/
// @include     /^https:\/\/bs\.to\/serie\/[^\/]+\/\d+\/[^\/\:]+$/
// @include     /^https:\/\/bs\.to\/serie\/[^\/]+\/\d+\/[^\/\:]+\/+[A-Za-z]+$/
// @version    	1.0
// @description	Select Hoster
// @author     	Kartoffeleintopf
// @run-at 		document-start
// @require 	https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/data.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/playlistStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/seriesStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/logStorage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/Universal/scripts/initPage.js
// @require     https://kartoffeleintopf.github.io/Pr0jectWatch/BsSite/scripts/keyControll.js
// @downloadURL http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_4.user.js
// ==/UserScript==

/**
 * Redirects to currect hoster
 */
var initHosterList = function () {
    makeBlackPage();

    $(document).ready(function () {
        //Get Hosterlist
        var hoster = [];
        $('.hoster-tabs a').each(function () {
            hoster.push($(this).text().trim());
        });

        var errorCode = getData('errorCode', 0);
        var hasHoster = false;
        $.each(JSON.parse(getData('hoster', JSON.stringify(defaultHoster))), function (index, value) {
            var hosterIndex = $.inArray(value, hoster);
            if (hosterIndex != -1) {
                if (errorCode-- < 1) {
                    hasHoster = true;
                    window.location = window.location + '/' + value;
                    return false;
                }
            }
        });

        if (!hasHoster) {
            alert('No Hoster For This Episode');
            window.location = window.location + '/NoHoster';
        }

    });
}

/**
 * Decide with Pages Loads.
 */
var initPageStart = function () {
    if (/^https:\/\/bs\.to\/serie\/[^\/]+\/\d+\/[^\/\:]+$/.test(window.location.href)) {
        initHosterList();
    } else {
        initBsPage();
    }
}
initPageStart();

/**
 * Init Page Redirect and Provide noneSupport Hoster Redirect
 */
var onDocumentReady = function () {
    var seriesId = window.location.pathname.split('/')[2];
    var seriesName = $('#sp_left h2').clone().children().remove().end().text().trim();
    var season = window.location.pathname.split('/')[3];
    var episodeDE = $('#titleGerman').clone().children().remove().end().text().trim();
    var episodeOR = $('#titleGerman small').clone().children().remove().end().text().trim();
    var episodeIndex = $('#episodes .active:first a').text().trim();
    var episodeMax = $('#episodes li:last a').text().trim();
    var hoster = window.location.pathname.split('/')[5].split('?')[0];

    //Setting
    if (getData('enableLog', true)) {
        setLog(seriesId, seriesName, season, episodeDE, episodeOR, episodeIndex, episodeMax, hoster);
    }
    //Setting
    if (getData('autoAutoplay', false)) {
        setData('autoplay', true);
    }
    //Setting
    if (getData('updateSeason', true)) {
        updateEntry({
            Id: seriesId,
            FavSeason: season
        });
    }
    setForAutoplay();

    if (hoster == 'NoHoster') {
        window.location = 'https://bs.to/?next';
        return true;
    }

    var supportet = false;
    $.each(hosterSupport, function (i, supp) {
        if (supp[0] == hoster) {
            supportet = supp[1];
            return false;
        }
    });

    if (getData('isPlayingPlaylist', false)) {
        removePlayList(getFullPlayList()[0].episodeID);
    }

    if (supportet) {
        window.location = 'https://bs.to/data'
             + '?redirect=' + jEncode($('.hoster-player:first').attr('href'))
             + '&series=' + jEncode(seriesName)
             + '&season=' + jEncode(season)
             + '&episode=' + jEncode(((episodeDE != '') ? episodeDE : episodeOR))
             + '&episodeRange=' + jEncode(episodeIndex + '/' + episodeMax)
             + '&style=' + jEncode(getData('style', styleColors.Default))
             + '&autoplay=' + jEncode(getData('autoplay', false))
             + '&closeEnd=' + jEncode(getData('closeEnd', true))
             + '&enablePreview=' + jEncode(getData('enablePreview', true))
             + '&previewSteps=' + jEncode(getData('previewSteps', 20))
             + '&timeShow=' + jEncode(getData('timeShow', 3));
        return true;
    } else {
        var win = window.open($('.hoster-player:first').attr('href'), "Project Watch Video", "");
        var pollTimer = window.setInterval(function () {
                if (win.closed !== false) { // !== is required for compatibility with Opera
                    window.clearInterval(pollTimer);
                    window.location = 'https://bs.to/?next';
                }
            }, 200);
        $('.hoster-player:first').attr('href', 'https://www.google.de/');
    }

    $('#contentContainer').empty().append('<h1 class="mainSiteTitle">Open Hosterwindow</h1>').append('<button id="nextButton">Next Episode</button>').find('#nextButton').bind('click', function () {
        window.location = 'https://bs.to/?next';
    });

    initSideCont();
}

/**
 * Set Constant Variables for next Autoplay.
 */
var setForAutoplay = function () {
    setData('lastSeries', window.location.pathname.split('/')[2]);
    setData('lastSeason', window.location.pathname.split('/')[3]);
    setData('lastEpisode', window.location.pathname.split('/')[4]);
}

/**
 * Creates a list with max Five Elements of the last watched Series with Seasons.
 */
var initSideCont = function () {
    var target = $('#sideContainerContent').empty().append('<h1 class="sideSiteTitel">Last Watched</h1>');

    var lastFiveList = [];
    $.each(getFullLog().reverse(), function (index, value) {
        if (!containsObject(value, lastFiveList)) {
            lastFiveList.push(value);
            return !(lastFiveList.length > 4) // Break if 5 Elements reached - Rest is Continue
        }
    });

    $.each(lastFiveList, function (index, value) {
        target.append('<div href="' + ('https://bs.to/serie/' + value.seriesId + '/' + value.season) + '" class="lastWatchedButton"><div class="lastWatchedsideTriangle"></div><div class="lastWatchedText">' + value.series + '</div></div>');
    });

    $('.lastWatchedButton').bind('click', function () {
        window.location = $(this).attr('href');
    });
}

/**
 * Checks if ObjectList Already contains series.
 * @param obj {Object} - Series Object.
 * @param list {Object-Array} - Series List
 * @return {Boolean}
 */
var containsObject = function (obj, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].series == obj.series) {
            return true;
            break;
        }
    }
    return false;
}
