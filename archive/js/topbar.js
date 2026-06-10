$(document).ready(function() {
    let lastScrollTop = 0;
    let headerHeight = $('#topbar').outerHeight();

    $(window).scroll(function() {
        let currentScroll = $(this).scrollTop();

        if (currentScroll > lastScrollTop) {
            // 往下滾動，隱藏 header
            $('#topbar').css({
                'top': -headerHeight + 'px',
                'transition': 'top 0.5s' // 添加過渡效果
            });
        } else {
            // 往上滾動，顯示 header
            $('#topbar').css({
                'top': '0',
                'transition': 'top 0.5s' // 添加過渡效果
            });
        }

        lastScrollTop = currentScroll;
    });
});