String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

$(document).on('pagecreate', '#dirwalker', function() {

    var backendUrl = 'http://dirwalker-receptor.c9.io/?dir=',
        dirs = $('#dirs'),
        home = $('#home'),
        back = $('#back'),
        footer = $('#footer'),
        parent = '',
        breadcrumbe = $('#breadcrumbe'),
        crumbsList = $('#crumbsList'),
        history=[];

    function bytesToSize(bytes) {
        if (bytes == 0) return '0 Byte';
        var k = 1000;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }

    function fetchDir(path) {

        $.mobile.loading('show');
        $.ajax({
            url: backendUrl + path,
            dataType: 'json'
        }).then(function ajaxResponse(res) {

            console.log(res);
            localStorage.setItem('cwd', res.header.Path);
            var itemTemplate = $('#itemTemplate').html(),
                crumbTemplate = $('#crumbTemplate').html(),
                crumbs = res.header.Breadcrumb.filter(function(v) {
                    // fix breadcrumb[1] has empty element
                    return v !== ''
                }),
                html = '',
                size = 0;

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
            
            
            breadcrumbe.html(crumbs[0]);
            html='';
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
    
    $("#search").on('click', function(e) {
        $('#searchform').toggle(0,function(){
            $('#searchform input[data-type="search"]').val('');
            $('#searchform input[data-type="search"]').trigger("keyup");
        }).trigger( "updatelayout" );
    });
    
    $( "#dirs" ).on( "filterablefilter", function( event, ui ) {
        console.log('filter', ui)
    } );

    fetchDir(localStorage.getItem('cwd') || '/');
});