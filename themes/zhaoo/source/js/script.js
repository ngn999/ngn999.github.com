console.log("%c Github %c", "background:#333333; color:#ffffff", "", "https://github.com/izhaoo/hexo-theme-zhaoo");

(function ($) {
  "use strict";

  var Func = {
    showMenu: function () {
      $(".menu").addClass("menu-active").fadeIn(300);
      $("body").addClass("lock-screen");
      $("main").addClass("blur");
      $(".preview").addClass("blur");
      $(".footer").addClass("blur");
    },
    hideMenu: function () {
      $(".menu").removeClass("menu-active").fadeOut(300);
      $("body").removeClass("lock-screen");
      $("main").removeClass("blur");
      $(".preview").removeClass("blur");
      $(".footer").removeClass("blur");
    },
    showFab: function () {
      $(".fab-menu").addClass("fab-menu-active");
      $(".fab-up").addClass("fab-up-active");
      $(".fab-plus").addClass("fab-plus-active");
    },
    hideFab: function () {
      $(".fab-menu").removeClass("fab-menu-active");
      $(".fab-up").removeClass("fab-up-active");
      $(".fab-plus").removeClass("fab-plus-active");
    },
    scroolToTop: function () {
      $('body,html').animate({
        scrollTop: '0px'
      }, 800);
    },
    showGitalk: function () {
      var gitalk = new Gitalk(CONFIG.gitalk)
      gitalk.render('gitalk-container')
    }
  }

  var Action = {
    smoothScroll: function () {
      $(".smooth-scroll").click(function () { // a[href *=#], area[href *=#]
        if (location.pathname.replace(/^\//, "") == this.pathname.replace(/^\//, "") && location.hostname == this.hostname) {
          var $target = $(this.hash);
          $target = $target.length && $target || $("[name=" + this.hash.slice(1) + "]");
          if ($target.length) {
            var targetOffset = $target.offset().top;
            $("html,body").animate({
              scrollTop: targetOffset
            }, 800);
            return false;
          }
        }
      });
    },
    loading: function () {
      $(".loading").delay(500).fadeOut(300);
      $("body").removeClass("lock-screen");
    },
    fab: function () {
      $(".fab-plus").on("click", function () {
        if ($(this).hasClass("fab-plus-active")) {
          Func.hideFab();
        } else {
          Func.showFab();
        }
      });
      $(".fab-menu").on("click", function () {
        if ($(".menu").hasClass("menu-active")) {
          Func.hideMenu();
        } else {
          Func.showMenu();
        }
      });
      $(".fab-menu, .fab-up").on("click", function () {
        Func.hideFab();
      });
    },
    menu: function () {
      $(".menu-close").on("click", function () {
        Func.hideMenu();
      });
    },
    scroolToTop: function () {
      $(".fab-up").on("click", function () {
        Func.scroolToTop();
      })
    },
    fancybox: function () {
      $(function () {
        $(".fancybox").fancybox();
        $(".article .content img").each(function () {
          var e = document.createElement("a");
          $(e).attr("data-fancybox", "images");
          $(e).attr("href", $(this).attr("src"));
          $(this).wrap(e);
        });
      });
    },
    pjax: function () {
      $(function () {
        $(document).pjax("a:not(.menu *)", '#main', {
          fragment: '#main',
          timeout: 6000
        });
      });
      $(document).on('pjax:complete', function () {
        if (CONFIG.fancybox) {
          Action.fancybox();
        }
      });
    },
    highlight: function () {
      $('.code').each(function (i, e) {
        hljs.highlightBlock(e)
      });
    },
    donate: function () {
      $(".donate .icon").on("mouseover", function () {
        $(".donate .qrcode").show();
      });
      $(".donate .icon").children("a").on("mouseover", function () {
        $(".donate .qrcode img").attr('src', eval('CONFIG.donate_' + $(this).attr('id')))
      });
      $(".donate .icon").on("mouseout", function () {
        $(".donate .qrcode").hide();
      });
    },
    gitalk: function () {
      $("#show-gitalk").on("click", function () {
        $(this).hide();
        Func.showGitalk();
      })
    },
    motto: function () {
      if (CONFIG.motto.api) {
        $.get(CONFIG.motto.api, function (data) {
          $("#motto").text(data);
        });
      } else {
        console.log(CONFIG.motto.default)
        $("#motto").text(CONFIG.motto.default);
      }
    }
  }

  $(function () {
    Action.smoothScroll();
    Action.loading();
    Action.fab();
    Action.menu();
    Action.scroolToTop();
    Action.motto();
    if (CONFIG.fancybox) {
      Action.fancybox();
    }
    if (CONFIG.pjax) {
      Action.pjax();
    }
    if (CONFIG.highlight) {
      Action.highlight();
    }
    if (CONFIG.donate_alipay || CONFIG.donate_wechat) {
      Action.donate();
    }
    if (CONFIG.gitalk.enable) {
      Action.gitalk();
    }
  });

})(jQuery);