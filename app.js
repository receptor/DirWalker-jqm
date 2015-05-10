/* global doT */

// app start
$(document).on('pagecreate', '#dirwalker', function walk() {

    var dirWalker = {},
        backendUrl = 'http://dirwalker-receptor.c9.io/',
        dirs = $('#dirs'),
        home = $('#home'),
        up = $('#up'),
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

    function setDir(dir) {

        var crumbs = dir.header.Breadcrumb.filter(function removeEmpty(v) {
                // fix breadcrumb[1] has empty element
                return v !== ''
            }),
            size = 0;

        console.log('setDir',dir);
        localStorage.setItem('cwd', dir.header.Path);

        parent = crumbs[1] || crumbs[0] || '/';

        // update dirs view
        $.each(dir.items, function createFile(i, item) {
            item.Img = item.IsDir === true ? 'img/folder-closed.png' : 'img/file.png';
            size += item.Size,
            item.Size = bytesToSize(item.Size);
        });
        listviewAdd(dirs, $('#itemTemplate').html(), dir.items, true);

        // update breadcrumb
        breadcrumbe.html(crumbs[0]);
        listviewAdd($('#crumbsList'), $('#crumbTemplate').html(), crumbs, true);

        footer.html(dir.items.length + ' items, ' + bytesToSize(size));
        $.mobile.loading('hide');
    };

    function fetchDir(path) {

        $.mobile.loading('show');
        $.ajax({
            url: backendUrl,
            dataType: 'json',
            data: {
                dir: path,
                sort: $('input:radio[name=settings-sort]:checked').val() || 'Name',
                sd: $('input:radio[name=settings-sortdir]:checked').val() || 'asc'
            }
        }).then(setDir);
    }

    dirs.on('click', 'a[href="#"]', function(e) {
        var li = $(this).closest('li');
        console.log('get',li.attr('data-path'));
        if (li.attr('data-isdir') === 'true') fetchDir(li.attr('data-path'));
    });

    $('#crumbsList').on('click', 'li', function(e) {
        fetchDir($(this).attr('data-path'));
        $('#crumbsMenu').popup('close');
    });

    home.on('click', function(e) {
        fetchDir('/');
    });

    up.on('click', function(e) {
        fetchDir(parent);
    });
    
    $("#search").on('click', function(e) {
        $('#searchform').toggle(0, function() {
            // remove filter on search hide
            $('#searchform input[data-type="search"]').val('');
            $('#searchform input[data-type="search"]').trigger("keyup");
        }).trigger("updatelayout");
    });
    
    addBookmark.on('click', function(e) {
        var cwd = localStorage.getItem('cwd');
        bookmarks.push(cwd);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        listviewAdd($("#bookmarkList"), $('#bookmarkTemplate').html(), [cwd]);
    });
    
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