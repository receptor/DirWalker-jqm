String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

// app start
$(document).on('pagecreate', '#dirwalker', function walk() {

    var backendUrl = 'http://dirwalker-receptor.c9.io/?dir=',
        dirs = $('#dirs'),
        home = $('#home'),
        back = $('#back'),
        addBookmark = $('#addBookmark'),
        footer = $('#footer'),
        breadcrumbe = $('#breadcrumbe'),
        crumbsList = $('#crumbsList'),
        parent = '',
        bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [],
        history = [];

    function bytesToSize(bytes) {
        if (bytes == 0) return '0 Byte';
        var k = 1000;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }
    
    function listviewAdd(list, template, data)
    {
        var html = [];
        $.each(data, function createItem(idx, item) {
            html += template.format(item);
            });
        list.append(html);
        list.listview('refresh');
        list.trigger('updatelayout');
    };
    
    function fetchDir(path) {

        $.mobile.loading('show');
        $.ajax({
            url: backendUrl + path,
            dataType: 'json'
        }).then(function ajaxResponse(res) {

            var itemTemplate = $('#itemTemplate').html(),
                crumbTemplate = $('#crumbTemplate').html(),
                crumbs = res.header.Breadcrumb.filter(function removeEmpty(v) {
                    // fix breadcrumb[1] has empty element
                    return v !== ''
                }),
                html = '',
                size = 0;

            console.log(res);
            localStorage.setItem('cwd', res.header.Path);

            parent = crumbs[1] || crumbs[0] || '/';

            // update dirs view
            $.each(res.items, function createFile(i, v) {

                var img = v.IsDir === 'true' ? 'img/folder-closed.png' : 'img/file.png';
                size += parseInt(v.Size);
                html += itemTemplate.format(v.Path, v.IsDir, img, v.Name, v.Mode, v.ModTime, bytesToSize(v.Size));
            });
            dirs.html(html);
            dirs.listview('refresh');
            dirs.trigger('updatelayout');

            // update breadcrumb
            breadcrumbe.html(crumbs[0]);
            html = '';
            $.each(crumbs, function createCrumb(i, v) {
                html += crumbTemplate.format(v);
            });
            crumbsList.html(html);
            crumbsList.listview('refresh');
            crumbsList.trigger('updatelayout');

            history.push(res.header.Path);
            footer.html(res.items.length + ' items, ' + bytesToSize(size));
            $.mobile.loading('hide');
        });
    }

    dirs.on('click', 'li', function(e) {
        if ($(this).attr('data-isdir') === 'true') fetchDir($(this).attr('data-path'));
    });

    crumbsList.on('click', 'li', function(e) {
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
        listviewAdd($("#bookmarkList"), $('#crumbTemplate').html(), [cwd]);
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
    
    listviewAdd($("#bookmarkList"), $('#crumbTemplate').html(), bookmarks)
    fetchDir(localStorage.getItem('cwd') || '/');
});