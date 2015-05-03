/* global doT */

// app start
$(document).on('pagecreate', '#dirwalker', function walk() {

    var dirWalker = {},
        backendUrl = 'http://dirwalker-receptor.c9.io/?dir=',
        dirs = $('#dirs'),
        home = $('#home'),
        back = $('#back'),
        addBookmark = $('#addBookmark'),
        footer = $('#footer'),
        breadcrumbe = $('#breadcrumbe'),
        parent = '',
        bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

    function bytesToSize(bytes) {
        if (bytes == 0) return '0 Byte';
        var k = 1000;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }

    /**
     * Add items to a listview.
     * Applies template to an array of data elements
     * will replace items if replace is true
     */
    function listviewAdd(list, template, data, replace) {
        var html = [],
            tpl = doT.template(template);
        $.each(data, function createItem(idx, item) {
            html += tpl(item);
        });
        replace ? list.html(html) : list.append(html);
        list.listview('refresh');
        list.trigger('updatelayout');
    };

    function fetchDir(path) {

        $.mobile.loading('show');
        $.ajax({
            url: backendUrl + path,
            dataType: 'json'
        }).then(function ajaxResponse(res) {

            var crumbs = res.header.Breadcrumb.filter(function removeEmpty(v) {
                    // fix breadcrumb[1] has empty element
                    return v !== ''
                }),
                size = 0;

            console.log(res);
            localStorage.setItem('cwd', res.header.Path);

            parent = crumbs[1] || crumbs[0] || '/';

            // update dirs view
            $.each(res.items, function createFile(i, item) {
                item.Img = item.IsDir === 'true' ? 'img/folder-closed.png' : 'img/file.png';
                item.Size = parseInt(item.Size),
                size += item.Size,
                item.Size = bytesToSize(item.Size);
            });
            listviewAdd(dirs, $('#itemTemplate').html(), res.items, true);

            // update breadcrumb
            breadcrumbe.html(crumbs[0]);
            listviewAdd($('#crumbsList'), $('#crumbTemplate').html(), crumbs, true);

            footer.html(res.items.length + ' items, ' + bytesToSize(size));
            $.mobile.loading('hide');
        });
    }

    dirs.on('click', 'li', function(e) {
        if ($(this).attr('data-isdir') === 'true') fetchDir($(this).attr('data-path'));
    });

    $('#crumbsList').on('click', 'li', function(e) {
        fetchDir($(this).attr('data-path'));
        $('#crumbsMenu').popup('close');
    });

    home.on('click', function(e) {
        fetchDir('/');
    });

    back.on('click', function(e) {
        fetchDir(parent);
    });

    addBookmark.on('click', function(e) {
        var cwd = localStorage.getItem('cwd');
        bookmarks.push(cwd);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        listviewAdd($("#bookmarkList"), $('#bookmarkTemplate').html(), [cwd]);
    });

    $("#search").on('click', function(e) {
        $('#searchform').toggle(0, function() {
            // remove filter on search hide
            $('#searchform input[data-type="search"]').val('');
            $('#searchform input[data-type="search"]').trigger("keyup");
        }).trigger("updatelayout");
    });

    $("#dirs").on("filterablefilter", function(event, ui) {
        console.log('filter', ui)
    });

    // delete bookmark handler
    listviewAdd($("#bookmarkList"), $('#bookmarkTemplate').html(), bookmarks);
    $('#bookmarkList').delegate('a[data-action="deleteBookmark"]', 'click', function(e) {
        if (confirm('Delete bookmark?')) {
            bookmarks.splice($.inArray($(this).attr('data-path'), bookmarks), 1);
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            $(this).parent().remove();
        }
    });

    $('#bookmarkList').delegate('a[data-action="gotoBookmark"]', 'click', function(e) {
        $('#bookmarkMenu').popup('close');
        fetchDir($(this).parent().attr('data-path'));
    });

    // start
    fetchDir(localStorage.getItem('cwd') || '/');
});