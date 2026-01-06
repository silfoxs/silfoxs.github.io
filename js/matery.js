$(function () {
    /**
     * 添加文章卡片hover效果.
     */
    let articleCardHover = function () {
        let animateClass = 'animated pulse';
        $('article .article').hover(function () {
            $(this).addClass(animateClass);
        }, function () {
            $(this).removeClass(animateClass);
        });
    };
    articleCardHover();

    /* ========== 桌面端导航滑块指示器 ========== */
    let initNavSlider = function () {
        let $navMenu = $('nav#headNav .nav-menu');
        if ($navMenu.length === 0) return;

        // 创建滑块指示器
        let $slider = $('<div class="nav-slider-indicator"></div>');
        $navMenu.css('position', 'relative').append($slider);

        let $navItems = $navMenu.find('> li.nav-item > a');
        let $activeItem = null; // 当前点击激活的项
        let isHovering = false;

        // 更新滑块位置
        function updateSlider($target) {
            if (!$target || $target.length === 0) {
                $slider.removeClass('active');
                return;
            }

            let offset = $target.position();
            let width = $target.outerWidth();
            let height = $target.outerHeight();

            $slider.css({
                left: offset.left + 'px',
                top: offset.top + (height - 35) / 2 + 'px',
                width: width + 'px'
            }).addClass('active');
        }

        // 鼠标悬停跟随
        $navItems.on('mouseenter', function () {
            isHovering = true;
            updateSlider($(this));
        });

        // 鼠标离开 - 回到激活项或隐藏
        $navMenu.on('mouseleave', function () {
            isHovering = false;
            if ($activeItem) {
                updateSlider($activeItem);
            } else {
                $slider.removeClass('active');
            }
        });

        // 点击保持
        $navItems.on('click', function () {
            $activeItem = $(this);
            updateSlider($activeItem);
        });

        // 检查当前页面对应的导航项并激活
        let currentPath = window.location.pathname;
        $navItems.each(function () {
            let href = $(this).attr('href');
            if (href && currentPath.indexOf(href) === 0 && href !== '/') {
                $activeItem = $(this);
                updateSlider($activeItem);
            }
        });
    };

    // 仅在桌面端初始化
    if ($(window).width() > 992) {
        initNavSlider();
    }

    /*菜单切换 - 自定义顶部滑入动画*/
    // 创建遮罩层
    if ($('.mobile-nav-overlay').length === 0) {
        $('body').append('<div class="mobile-nav-overlay"></div>');
    }

    // 移动端菜单切换
    $('.sidenav-trigger').on('click', function (e) {
        e.preventDefault();
        let $mobileNav = $('#mobile-nav');
        let $overlay = $('.mobile-nav-overlay');

        if ($mobileNav.hasClass('sidenav-open')) {
            // 关闭菜单
            $mobileNav.removeClass('sidenav-open');
            $overlay.removeClass('active');
        } else {
            // 打开菜单
            $mobileNav.addClass('sidenav-open');
            $overlay.addClass('active');
        }
    });

    // 点击遮罩层关闭菜单
    $(document).on('click', '.mobile-nav-overlay', function () {
        $('#mobile-nav').removeClass('sidenav-open');
        $(this).removeClass('active');
    });

    // 点击菜单项后关闭菜单
    $('#mobile-nav .menu-list a').on('click', function () {
        if (!$(this).next('ul').length) {
            $('#mobile-nav').removeClass('sidenav-open');
            $('.mobile-nav-overlay').removeClass('active');
        }
    });

    /* 修复文章卡片 div 的宽度. */
    let fixPostCardWidth = function (srcId, targetId) {
        let srcDiv = $('#' + srcId);
        if (srcDiv.length === 0) {
            return;
        }

        let w = srcDiv.width();
        if (w >= 450) {
            w = w + 21;
        } else if (w >= 350 && w < 450) {
            w = w + 18;
        } else if (w >= 300 && w < 350) {
            w = w + 16;
        } else {
            w = w + 14;
        }
        $('#' + targetId).width(w);
    };

    /**
     * 修复footer部分的位置，使得在内容比较少时，footer也会在底部.
     */
    let fixFooterPosition = function () {
        $('.content').css('min-height', window.innerHeight - 165);
    };

    /**
     * 修复样式.
     */
    let fixStyles = function () {
        fixPostCardWidth('navContainer');
        fixPostCardWidth('artDetail', 'prenext-posts');
        fixFooterPosition();
    };
    fixStyles();

    /*调整屏幕宽度时重新设置文章列的宽度，修复小间距问题*/
    $(window).resize(function () {
        fixStyles();
    });

    /*初始化瀑布流布局*/
    $('#articles').masonry({
        itemSelector: '.article'
    });

    AOS.init({
        easing: 'ease-in-out-sine',
        duration: 700,
        delay: 100
    });

    /*文章内容详情的一些初始化特性*/
    let articleInit = function () {
        $('#articleContent a').attr('target', '_blank');

        $('#articleContent img').each(function () {
            let imgPath = $(this).attr('src');
            $(this).wrap('<div class="img-item" data-src="' + imgPath + '" data-sub-html=".caption"></div>');
            // 图片添加阴影
            $(this).addClass("img-shadow img-margin");
            // 图片添加字幕
            let alt = $(this).attr('alt');
            let title = $(this).attr('title');
            let captionText = "";
            // 如果alt为空，title来替
            if (alt === undefined || alt === "") {
                if (title !== undefined && title !== "") {
                    captionText = title;
                }
            } else {
                captionText = alt;
            }
            // 字幕不空，添加之
            if (captionText !== "") {
                let captionDiv = document.createElement('div');
                captionDiv.className = 'caption';
                let captionEle = document.createElement('b');
                captionEle.className = 'center-caption';
                captionEle.innerText = captionText;
                captionDiv.appendChild(captionEle);
                this.insertAdjacentElement('afterend', captionDiv)
            }
        });
        $('#articleContent, #myGallery').lightGallery({
            selector: '.img-item',
            // 启用字幕
            subHtmlSelectorRelative: true
        });

        // progress bar init
        const progressElement = window.document.querySelector('.progress-bar');
        if (progressElement) {
            new ScrollProgress((x, y) => {
                progressElement.style.width = y * 100 + '%';
            });
        }
    };
    articleInit();

    $('.modal').modal();

    /*回到顶部*/
    $('#backTop').click(function () {
        $('body,html').animate({ scrollTop: 0 }, 400);
        return false;
    });

    /*监听滚动条位置*/
    let $nav = $('#headNav');
    let $backTop = $('.top-scroll');
    // 当页面处于文章中部的时候刷新页面，因为此时无滚动，所以需要判断位置,给导航加上绿色。
    showOrHideNavBg($(window).scrollTop());
    $(window).scroll(function () {
        /* 回到顶部按钮根据滚动条的位置的显示和隐藏.*/
        let scroll = $(window).scrollTop();
        showOrHideNavBg(scroll);
    });

    function showOrHideNavBg(position) {
        let showPosition = 100;
        if (position < showPosition) {
            $nav.addClass('nav-transparent');
            $backTop.slideUp(300);
        } else {
            $nav.removeClass('nav-transparent');
            $backTop.slideDown(300);
        }
    }


    $(".nav-menu>li").hover(function () {
        $(this).children('ul').stop(true, true).show();

    }, function () {
        $(this).children('ul').stop(true, true).hide();
    })

    $('.m-nav-item>a').on('click', function () {
        if ($(this).next('ul').css('display') == "none") {
            $('.m-nav-item').children('ul').slideUp(300);
            $(this).next('ul').slideDown(100);
            $(this).parent('li').addClass('m-nav-show').siblings('li').removeClass('m-nav-show');
        } else {
            $(this).next('ul').slideUp(100);
            $('.m-nav-item.m-nav-show').removeClass('m-nav-show');
        }
    });

    // 初始化加载 tooltipped.
    $('.tooltipped').tooltip();
});
