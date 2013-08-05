var app = {};
app.session = {};
app.data = {};

app.util = {};
app.util.popup = function(kind_p, message_p){
    if($("#popup").is(':hidden')){
        $("#popup").empty();
        $("#popup").append(message_p);
        switch(kind_p){
            case 'ok':
                $("#popup").css('background-color', '#2ecc71');
                break;
            case 'error':
                $("#popup").css('background-color', '#ff626d');
                break;
        }
        $("#popup").fadeIn();
        $('#popup').delay(2000).fadeOut();
    }
}
app.util.cookieCreate = function(name_p,value_p) {
    var expires;
    var date = new Date();
    date.setTime(date.getTime()+(config.session_days*24*60*60*1000));
    expires = "; expires="+date.toGMTString();
    document.cookie = name_p+"="+value_p+expires+"; path=/;";
}
app.util.cookieRead = function(name_p) {
    var nameEQ = name_p + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
app.util.cookieErase = function(name_p) {
    var expires;
    var date = new Date();
    date.setTime(date.getTime()+(-1));
    expires = "; expires="+date.toGMTString();
    document.cookie = name_p+"="+" "+expires+"; path=/;";
}
app.util.sessionClear = function(){
    app.session.firstKey = null;
    app.util.cookieErase('firstKey');

    app.session.token = null;
    app.util.cookieErase('token');
    
    app.session.pendingPack = null;
    app.util.cookieErase('pendingPack');
}
app.util.smsCharsLeft = function(message_p){
    var max_chars = 0;
    if(/^[\x00-\x7F]*$/.test(message_p)){
        max_chars = 160;
    } else {
        max_chars = 70;
    }
    return max_chars - message_p.length;
}

app.http = {};
app.http.geoIP = function(){
    $.ajax({
        type: "GET",
        url: 'http://freegeoip.net/json/',
        dataType: "json",
        success: app.handlers.setGeo,
        error: function(jxhr, status, err){}
    });
}
app.http.get = function(path_p, params_p, handler_p){
    var params = '?';
    for (var key in params_p) {
        params += '&' + key + '=' + params_p[key];
    }

    $.ajax({
        type: "GET",
        url: config.backend+path_p+params,
        dataType: "json",
        success: handler_p,
        error: function(jxhr, status, err){
            app.util.popup('error', err);
        }
    });
}
app.http.post = function(path_p, params_p, handler_p){
    $.ajax({
        type: "POST",
        url: config.backend+path_p,
        data : params_p,
        dataType: "json",
        success: handler_p,
        error: function(jxhr, status, err){
            app.util.popup('error', err);
        }
    });
}


app.handlers = {};
app.handlers.setGeo = function(data_p){
    if(undefined !== data_p['country_code']){
        if('MX' === data_p['country_code']){
            config.number = config.mx_number;
            app.push.number();
        }
    }
}
app.handlers.loginReturn = function(data_p){
    if(data_p['success']){
        app.session.token = data_p['token'];
        app.util.cookieCreate('token', app.session.token);

        app.menus.session();
        app.pages.dash();
    } else {
        app.util.popup('error', data_p['message']);
    }
}
app.handlers.createKeywordSearch = function(data_p){
    if(data_p['success']){
        $("#create_keyword_check").attr("src","/img/error.gif");
        app.util.popup('error', 'The selected keyword is not available.');
    } else {
        $("#create_keyword_check").attr("src","/img/ok.gif");
    }
}
app.handlers.createReturn = function(data_p){
    if(data_p['success']){
        app.pages.test();
    } else {
        app.util.popup('error', data_p['message']);
    }
}
app.handlers.testSubscriberSearch = function(data_p){
    if(data_p['success']){
        $("#test_email_check").attr("src","/img/error.gif");
        app.util.popup('error', 'There\'s an account with that email, try to login.');
    } else if(13 === data_p['err']){
        $("#test_email_check").attr("src","/img/error.gif");
        app.util.popup('error', 'Please insert a valid email.');
    } else {
        $("#test_email_check").attr("src","/img/ok.gif");
    }
}
app.handlers.testReturn = function(data_p){
    if(data_p['success']){
        app.session.token = data_p['token'];
        app.util.cookieCreate('token', app.session.token);

        app.menus.session();
        app.pages.dash();
    } else {
        app.util.popup('error', data_p['message']);
    }
}
app.handlers.dashSubscriber = function(data_p){
    if(data_p['success']){
        app.data.pack = data_p['pack_data'];
        app.push.dashStats();
        app.push.dashAvailable();
    } else {
    }
}
app.handlers.dashAirnotes = function(data_p){
    if(data_p['success']){
        app.data.airnotes = data_p['airnotes_data'];
        app.push.dashAvailable();
        app.push.dashAirnotes();
    } else {
    }
}
app.handlers.dashRequests = function(data_p){
    if(data_p['success']){
        app.data.requests = data_p['request_count'];
        app.push.dashStats();
    } else {
    }
}
app.handlers.addKeywordSearch = function(data_p){
    if(data_p['success'] && (null !== data_p['airnote_data']['id_subscriber'])){
        $("#add_keyword_check").attr("src","/img/error_b.gif");
    } else {
        $("#add_keyword_check").attr("src","/img/ok_b.gif");
    }
}
app.handlers.addReturn = function(data_p){
    if(data_p['success']){
        app.http.get('airnotes',
        {
            token: app.session.token
        }
        , app.handlers.dashAirnotes);
    } else {
        app.util.popup('error', data_p['message']);
    }
}
app.handlers.airActive = function(data_p){
    if(data_p['success']){
    } else {
        app.util.popup('error', data_p['message']);
    }
}
app.handlers.airDelete = function(data_p){
    if(data_p['success']){
        app.http.get('airnotes',
        {
            token: app.session.token
        }
        , app.handlers.dashAirnotes);
    } else {
        app.util.popup('error', data_p['message']);
    }
}
app.handlers.accountSubscriber = function(data_p){
    if(data_p['success']){
        app.data.pack = data_p['pack_data'];
        app.push.accountPack();
    } else {
    }
}
app.handlers.packUpdate = function(data_p){
    app.pages.dash();
}

app.menus = {};
app.menus.noSession = function(){
    var open = false;
    var login_email_default = 'email';
    var login_password_default = 'password';

    $('#menu_content').empty();
    $('#menu_content').append('<a id="a_login" href="#" class="menu_button">log in</a>');
    $("#a_login").click(function() {
        if(open){
            open = false;
            $('#a_login').css('color', '#7b8b91');
            $('#a_login').css('font-weight', '400');
            $('#login_form').remove();
        } else {
            open = true;
            $('#a_login').css('color', '#f39c12');
            $('#a_login').css('font-weight', '700');
            $('#menu_content').append('<div id="login_form" class="login_wrapper"></div>');
            $('#login_form').append('<input type="text" id="login_email" class="rounded" value="'+login_email_default+'" />');
            $('#login_form').append('<input type="password" id="login_password" class="rounded" value="'+login_password_default+'" />');
            $('#login_form').append('<a id="login_ok" href="#" class="login_button rounded">OK</a>');


            $("#login_email").focus(function(){
                if(login_email_default === $("#login_email").val()){
                    $("#login_email").val('');
                }
            });
            $("#login_email").blur(function(){
                if('' === $("#login_email").val()){
                    $("#login_email").val(login_email_default);
                }
            });

            $("#login_password").focus(function(){
                if(login_password_default === $("#login_password").val()){
                    $("#login_password").val('');
                }
            });
            $("#login_password").blur(function(){
                if('' === $("#login_password").val()){
                    $("#login_password").val(login_password_default);
                }
            });

            $("#login_ok").click(function() {
                if(login_email_default === $('#login_email').val()){
                    app.util.popup('error', 'Please enter your email');
                } else if(login_password_default === $('#login_password').val()){
                    app.util.popup('error', 'Please enter your password');
                } else {
                    app.http.post('subscribers/login',
                    {
                        email: $("#login_email").val(),
                        password: $("#login_password").val()
                    }
                    , app.handlers.loginReturn);
                }
            });
        }
    });
}
app.menus.session = function(current_p){
    $('#menu_content').empty();
    $('#menu_content').append('<a id="a_logout" href="#" class="menu_button">logout</a>');
    $('#menu_content').append('<a id="a_account" href="#" class="menu_button">account</a>');
    $('#menu_content').append('<a id="a_dashboard" href="#" class="menu_button">dashboard</a>');
    $("#a_logout").click(function() {
        app.util.sessionClear();
        app.pages.create();
    });
    $("#a_account").click(function() {
        app.pages.account();
    });
    $("#a_dashboard").click(function() {
        app.pages.dash();
    });

    $("#a_dashboard").removeClass('menu_enabled');
    $("#a_account").removeClass('menu_enabled');
    switch(current_p){
        case 'dashboard':
            $("#a_dashboard").addClass('menu_enabled');
            break;
        case 'account':
            $("#a_account").addClass('menu_enabled');
            break;
    }
}

app.pages = {};
app.pages.create = function(){
    app.menus.noSession();

    $('#main_content').empty();
    $('#main_content').append('<h1 class="h1_create">Create your first Airnote*</h1>');
    $('#main_content').append('<div class="clear"></div>');
    $('#main_content').append('<div id="div_keyword" class="div_keyword rounded_bottom"><input type="text" id="create_keyword" value="'+config.form_keyword_default+'" /><img id="create_keyword_check" class="check" src="/img/blank.gif" /></div>');
    $('#main_content').append('<div id="div_message" class="div_message rounded_bottom"><input type="text" id="create_message" value="'+config.form_message_default+'" /><img class="divide" src="/img/divide.gif" /><span id="create_counter" class="counter">160</span></div>');
    $('#main_content').append('<a id="a_ok" href="#" class="create_ok">OK</a>');
    $('#main_content').append('<div class="clear"></div>');
    $('#main_content').append('<h3 class="h3_footer">*Breezy SMS reply that works for you 24/7</h3>');
    $('#main_content').append("<p class='p_intro'>Like most people I have a phone in my pocket, and like most people I don't always have data access, or lots of time while I'm out of my house.</p>");
    $('#main_content').append("<p class='p_intro'>Since I travel a lot I come across many interesting things. Apartments I'd like to rent, performers I'd like to know better, restaurants I'd gladly come back to for special events.</p>");
    $('#main_content').append("<p class='p_intro'>The sad reality is that I don't remember the apartment after writing the phone, I won't type a long web address to learn about the performer, and I shouldn't interrupt a conversation to search for a restaurant on Twitter or Facebook.</p>");
    $('#main_content').append("<p class='p_intro'>I became aware that something was broken, and that's why I decided to create Airnote; a simple, fast, and universal way to provide information to potential renters, fans, or customers. Where you can ask anyone to send a short message and they'll get back important details, which will remain on their phone.</p>");
    $('#main_content').append("<p class='p_intro'>Go ahead and try it, it's free.</p>");
    $('#main_content').append("<p class='p_intro'>If you feel, after creating your account, that Airnote is not really working for you, please call me 206-512-4945 or send me a message in the bottom right corner, I'd love to hear how to better suit your needs.</p>");
    $('#main_content').append("<p class='p_intro'>&nbsp;</p>");
    
    $("#div_keyword").click(function() {
        $("#create_keyword").focus();
    });
    $("#div_message").click(function() {
        $("#create_message").focus();
    });
    $("#a_ok").click(function() {
        if('/img/ok.gif' !== $('#create_keyword_check').attr('src')){
            app.util.popup('error', 'Please verify your keyword');
        } else if (0 > app.util.smsCharsLeft($("#create_message").val())){
            app.util.popup('error', 'Please remove '+ -(app.util.smsCharsLeft($("#create_message").val())) + ' letters from your message');
        } else {
            app.session.firstKey = $("#create_keyword").val();
            app.util.cookieCreate('firstKey', app.session.firstKey);

            app.http.post('airnotes',
            {
                keyword: $("#create_keyword").val(),
                message: $("#create_message").val()
            }
            , app.handlers.createReturn);
        }
    });

    $("#create_keyword").focus(function(){
        if(config.form_keyword_default === $("#create_keyword").val()){
            $("#create_keyword").val('');
        }
    });
    $("#create_keyword").blur(function(){
        if('' === $("#create_keyword").val()){
            $("#create_keyword").val(config.form_keyword_default);
        }
    });
    $("#create_keyword").keypress(function(e){
        if(e.which === 32)
            return false;
    });
    $("#create_keyword").keyup(function(e){
        if(/^[\x00-\x7F]*$/.test($("#create_keyword").val())){
            app.http.post('airnotes/search',
            {
                keyword:$("#create_keyword").val()
            }
            , app.handlers.createKeywordSearch);
        } else {
            app.util.popup('error', 'Please remove special letters from your keyword.');
            $("#create_keyword_check").attr("src","/img/error.gif");
        }
    });

    $("#create_message").focus(function(){
        if(config.form_message_default === $("#create_message").val()){
            $("#create_message").val('');
        }
    });
    $("#create_message").blur(function(){
        if('' === $("#create_message").val()){
            $("#create_message").val(config.form_message_default);
        }
    });
    $("#create_message").keyup(function(){
        var count = app.util.smsCharsLeft($("#create_message").val());

        $("#create_counter").empty();
        (0 >= count)? $('#create_counter').css('color', '#f22f51') : $('#create_counter').css('color', '#3ab54b');
        $("#create_counter").append(count);
    });
}
app.pages.test = function(){
    app.menus.noSession();

    $('#main_content').empty();
    $('#main_content').append('<h2 class="h2_great">Great! Now try it:</h2>');
    $('#main_content').append('<h2 class="h2_send">send <span class="white bold">'+app.session.firstKey+'</span> to <span id="air_number_1" class="white bold">'+config.number+'</span> <span class="h2_small">(it\'s free)</span></h2>');
    $('#main_content').append('<img class="test_hr" src="/img/hr.gif" />');
    $('#main_content').append('<h3 class="h3_account">Create a free account to reserve your keyword</h3>');
    $('#main_content').append('<div id="div_email" class="div_email rounded_bottom"><input type="text" id="test_email" value="'+config.form_email_default+'" /><img id="test_email_check" class="check" src="/img/blank.gif" /></div>');
    $('#main_content').append('<div id="div_password" class="div_password rounded_bottom"><input type="password" id="test_password" value="'+config.form_password_default+'" /><img id="test_password_check" class="check" src="/img/blank.gif" /></div>');
    $('#main_content').append('<a id="a_create" href="#" class="test_create">CREATE</a>');
    $('#main_content').append('<div class="clear"></div>');

    $("#div_email").click(function() {
        $("#test_email").focus();
    });
    $("#test_email").focus(function(){
        if(config.form_email_default === $("#test_email").val()){
            $("#test_email").val('');
        }
    });
    $("#test_email").blur(function(){
        if('' === $("#test_email").val()){
            $("#test_email").val(config.form_email_default);
        } else {
            app.http.post('subscribers/search',
            {
                email:$("#test_email").val()
            }
            , app.handlers.testSubscriberSearch);
        }
    });

    $("#div_password").click(function() {
        $("#test_password").focus();
    });
    $("#test_password").focus(function(){
        if(config.form_password_default === $("#test_password").val()){
            $("#test_password").val('');
        }
    });
    $("#test_password").blur(function(){
        if('' === $("#test_password").val()){
            $("#test_password").val(config.form_password_default);
        }
    });
    $("#test_password").on("keyup focus", function(){
        var count = $("#test_password").val().length;
        if(count > 2){
            if(count < 6){
                $("#test_password_check").attr("src","/img/error.gif");
            } else {
                $("#test_password_check").attr("src","/img/ok.gif");
            }
        }
    });

    $("#a_create").click(function() {
        if('/img/ok.gif' !== $('#test_email_check').attr('src')){
            app.util.popup('error', 'Please verify your email');
        } else if ('/img/ok.gif' !== $('#test_password_check').attr('src')){
            if(config.form_password_default !== $("#test_password").val())
                app.util.popup('error', 'Please add '+ (6-$("#test_password").val().length) + ' elements to your password');
            else
                app.util.popup('error', 'Please choose your password');
        } else {
            app.http.post('subscribers',
            {
                keyword: app.session.firstKey,
                email: $("#test_email").val(),
                password: $("#test_password").val()
            }
            , app.handlers.testReturn);
        }
    });
}
app.pages.dash = function(){
    app.menus.session('dashboard');

    app.session.firstKey = null;
    app.util.cookieErase('firstKey');

    $('#main_content').empty();
    $('#main_content').append('<h4 class="h4_number">YOUR AIRNOTE PHONE: <span id="air_number_2" class="bold">'+config.number+'</span></h4>');
    $('#main_content').append('<h6 class="h6_upgrade"><a href="javascript:app.pages.account();" class="upgrade_button rounded">Upgrade</a><a href="javascript:app.pages.account();" class="upgrade_text">&nbsp;to use a shortcode.</a></h6>');
    $('#main_content').append('<div id="div_overview" class="overview_wrapper rounded"></div>');
    $('#div_overview').append('<div class="div_monthly bold">MONTHLY OVERVIEW</div>');
    $('#div_overview').append('<div class="div_stats bold"><span class="blue bold">REPLIES</span> &nbsp;&nbsp;&nbsp;&nbsp; SENT: <span id="stats_sent" class="stat_number bold">_</span> &nbsp;&nbsp;&nbsp;&nbsp; REMAINING: <span id="stats_remaining" class="stat_number bold">_</span> &nbsp;&nbsp;&nbsp;&nbsp; ON HOLD: <span id="stats_hold" class="stat_number bold">_</span></div>');
    $('#main_content').append('<h6 id="h6_upgrade_b" class="h6_upgrade_b"><a href="javascript:app.pages.account();" class="upgrade_text">You\'ve reached your monthly limit.&nbsp;</a><a href="javascript:app.pages.account();" class="upgrade_button rounded">Upgrade</a><a href="javascript:app.pages.account();" class="upgrade_text">&nbsp;to send additional replies.</a></h6>');
    $('#main_content').append('<div class="div_manager bold">AIRNOTE MANAGER</div>');
    $('#main_content').append('<div id="div_new" class="new_wrapper"></div>');
    $('#main_content').append('<div id="div_airnotes" class="airnotes_wrapper"></div>');

    app.http.get('subscribers',
    {
        token: app.session.token
    }
    , app.handlers.dashSubscriber);

    app.http.get('airnotes',
    {
        token: app.session.token
    }
    , app.handlers.dashAirnotes);

    app.http.get('requests',
    {
        token: app.session.token
    }
    , app.handlers.dashRequests);
}
app.pages.account = function(){
    app.menus.session('account');

    $('#main_content').empty();
    $('#main_content').append('<h3 class="h3_subscription">Select your subscription package</h3>');
    $('#main_content').append('<div class="div_pack left rounded_top"><h4 class="h4_pack">FREE</h4><img class="pack_hr" src="/img/hr_140.gif" /><h4 class="h4_pack">$0<span class="pack_mo">/MO</span></h4><img class="pack_hr" src="/img/hr_140.gif" /><h5 class="h5_includes">1 Airnote</h5><h5 class="h5_includes">10 replies</h5></div>');
    $('#main_content').append('<div class="div_pack rounded_top"><h4 class="h4_pack">BASIC</h4><img class="pack_hr" src="/img/hr_140.gif" /><h4 class="h4_pack">$9<span class="pack_mo">/MO</span></h4><img class="pack_hr" src="/img/hr_140.gif" /><h5 class="h5_includes">3 Airnotes</h5><h5 class="h5_includes">100 replies</h5></div>');
    $('#main_content').append('<div class="div_pack rounded_top"><h4 class="h4_pack">PRO</h4><img class="pack_hr" src="/img/hr_140.gif" /><h4 class="h4_pack">$49<span class="pack_mo">/MO</span></h4><img class="pack_hr" src="/img/hr_140.gif" /><h5 class="h5_includes">10 Airnotes</h5><h5 class="h5_includes">1,000 replies</h5><h5 class="h5_includes">not branded</h5></div>');
    $('#main_content').append('<div class="div_pack rounded_top"><h4 class="h4_pack">ENTERPRISE</h4><img class="pack_hr" src="/img/hr_140.gif" /><h4 class="h4_pack">$199<span class="pack_mo">/MO</span></h4><img class="pack_hr" src="/img/hr_140.gif" /><h5 class="h5_includes">50 Airnotes</h5><h5 class="h5_includes">10,000 replies</h5><h5 class="h5_includes">not branded</h5><h5 class="h5_includes">shortcode</h5></div>');
    $('#main_content').append('<a id="a_pack_0" href="#" class="pack_button rounded_bottom left">SELECT</a>');
    $('#main_content').append('<a id="a_pack_1" href="#" class="pack_button rounded_bottom">SELECT</a>');
    $('#main_content').append('<a id="a_pack_2" href="#" class="pack_button rounded_bottom">SELECT</a>');
    $('#main_content').append('<a id="a_pack_3" href="#" class="pack_button rounded_bottom">SELECT</a>');


    app.http.get('subscribers',
    {
        token: app.session.token
    }
    , app.handlers.accountSubscriber);
}

app.push = {};
app.push.number = function(){
    $('#air_number_1').empty();
    $('#air_number_1').append(config.number);
    $('#air_number_2').empty();
    $('#air_number_2').append(config.number);
}
app.push.dashStats = function(){
    if(undefined !== app.data.pack && undefined !== app.data.requests){
        if(app.data.pack['replies'] > app.data.requests){
            $('#div_overview').css('background-color', '#2985b0');
            $('#h6_upgrade_b').css('display', 'none');
        } else {
            $('#div_overview').css('background-color', '#e43f5c');
            $('#h6_upgrade_b').css('display', 'block');
        }

        $('#stats_sent').empty();
        $('#stats_sent').append((app.data.pack['replies'] > app.data.requests)? app.data.requests : app.data.pack['replies']);
        $('#stats_remaining').empty();
        $('#stats_remaining').append((app.data.pack['replies'] < app.data.requests)? 0 : app.data.pack['replies'] - app.data.requests);
        $('#stats_hold').empty();
        $('#stats_hold').append((app.data.pack['replies'] > app.data.requests)? 0 : app.data.requests - app.data.pack['replies']);
    }
}
app.push.dashAvailable = function(){
    if(undefined !== app.data.pack && undefined !== app.data.airnotes){
        if(0 >= (app.data.pack['airnotes'] - app.data.airnotes.length)){
            $('#div_new').empty();
            $('#div_new').append('<div class="div_key_upgrade"><h6 class="h6_upgrade_c"><a href="javascript:app.pages.account();" class="upgrade_button rounded">Upgrade</a><a href="javascript:app.pages.account();" class="upgrade_text dark">&nbsp;to create additional airnotes.</a></h6></div>');
        } else {
            $('#div_new').empty();
            $('#div_new').append('<div id="add_div_keyword" class="add_div_keyword rounded"><input type="text" id="add_keyword" value="'+config.form_keyword_default+'" /><img id="add_keyword_check" class="check" src="/img/blank_b.gif" /></div>');
            $('#div_new').append('<div id="add_div_message" class="add_div_message rounded"><input type="text" id="add_message" value="'+config.form_message_default+'" /><img class="divide" src="/img/divide_b.gif" /><span id="add_counter" class="counter">160</span></div>');
            $('#div_new').append('<a id="add_a_ok" href="#" class="add_ok rounded">ADD</a>');

            $("#add_div_keyword").click(function() {
                $("#add_keyword").focus();
            });
            $("#add_div_message").click(function() {
                $("#add_message").focus();
            });
            $("#add_a_ok").click(function() {
                if('/img/ok_b.gif' !== $('#add_keyword_check').attr('src')){
                    app.util.popup('error', 'Please verify your keyword');
                } else if (0 > app.util.smsCharsLeft($("#add_message").val())){
                    app.util.popup('error', 'Please remove '+ -(app.util.smsCharsLeft($("#add_message").val())) + ' letters from your message');
                } else {
                    app.http.post('airnotes',
                    {
                        token: app.session.token,
                        keyword: $("#add_keyword").val(),
                        message: $("#add_message").val()
                    }
                    , app.handlers.addReturn);
                }
            });

            $("#add_keyword").focus(function(){
                if(config.form_keyword_default === $("#add_keyword").val()){
                    $("#add_keyword").val('');
                }
            });
            $("#add_keyword").blur(function(){
                if('' === $("#add_keyword").val()){
                    $("#add_keyword").val(config.form_keyword_default);
                }
            });
            $("#add_keyword").keypress(function(e){
                if(e.which === 32)
                    return false;
            });
            $("#add_keyword").keyup(function(e){
                if(/^[\x00-\x7F]*$/.test($("#create_keyword").val())){
                    app.http.post('airnotes/search',
                    {
                        keyword:$("#add_keyword").val()
                    }
                    , app.handlers.addKeywordSearch);
                } else {
                    app.util.popup('error', 'Please remove special letters from your keyword.');
                    $("#add_keyword_check").attr("src","/img/error.gif");
                }
            });

            $("#add_message").focus(function(){
                if(config.form_message_default === $("#add_message").val()){
                    $("#add_message").val('');
                }
            });
            $("#add_message").blur(function(){
                if('' === $("#add_message").val()){
                    $("#add_message").val(config.form_message_default);
                }
            });
            $("#add_message").keyup(function(){
                var count = app.util.smsCharsLeft($("#add_message").val());

                $("#add_counter").empty();
                (0 >= count)? $('#add_counter').css('color', '#f22f51') : $('#add_counter').css('color', '#3ab54b');
                $("#add_counter").append(count);
            });
        }
    }
}
app.push.dashAirnotes = function(){
    if(undefined !== app.data.airnotes){
        $('#div_airnotes').empty();
        $.each(app.data.airnotes, function(id, airnote_data){
            $('#div_airnotes').append('<div class="div_airnote"><span class="air_keyword">'+airnote_data['keyword']+'</span><a id="air_'+airnote_data['id_airnote']+'_enable" href="#" class="air_enable '+ ((1 == airnote_data['active'])? 'air_enabled' : 'air_disabled') +'"></a><a id="air_'+airnote_data['id_airnote']+'_view" href="#" class="air_view"></a><a id="air_'+airnote_data['id_airnote']+'_delete" href="#" class="air_delete"></a></div>');
            $('#div_airnotes').append('<div id="div_'+airnote_data['id_airnote']+'_extra" class="div_airnote_extra"><span class="air_title">Reply message</span><span class="air_message">'+airnote_data['message']+'</span></div>');
            $("#air_"+airnote_data['id_airnote']+"_enable").click(function() {
                if ( $("#air_"+airnote_data['id_airnote']+"_enable").hasClass('air_enabled') ) {
                    $("#air_"+airnote_data['id_airnote']+"_enable").removeClass('air_enabled').addClass('air_disabled');
                } else {
                    $("#air_"+airnote_data['id_airnote']+"_enable").removeClass('air_disabled').addClass('air_enabled');
                }

                app.http.post('airnotes/active',
                {
                    token: app.session.token,
                    id_airnote : airnote_data['id_airnote']
                }
                , app.handlers.airActive);
            });
            $("#air_"+airnote_data['id_airnote']+"_view").click(function() {
                if('none' === $('#div_'+airnote_data['id_airnote']+'_extra').css('display')){
                    $('#air_'+airnote_data['id_airnote']+'_view').css('background-position', '-60px 0');
                    $('#div_'+airnote_data['id_airnote']+'_extra').css('display', 'block');
                } else {
                    $('#air_'+airnote_data['id_airnote']+'_view').css('background-position', '0 0');
                    $('#div_'+airnote_data['id_airnote']+'_extra').css('display', 'none');
                }
            });
            $("#air_"+airnote_data['id_airnote']+"_delete").click(function() {
                app.http.post('airnotes/delete',
                {
                    token: app.session.token,
                    id_airnote : airnote_data['id_airnote']
                }
                , app.handlers.airDelete);
            });
        });
    }
}
app.push.accountPack = function(){
    if(undefined !== app.data.pack){
        $('#a_pack_'+app.data.pack['pack_id']).css("background-color", "#2ecc71");
        $('#a_pack_'+app.data.pack['pack_id']).empty();
        $('#a_pack_'+app.data.pack['pack_id']).append('CURRENT');

        $('#a_pack_0').click(function() {
            app.http.post('subscribers/pack',
            {
                token: app.session.token,
                pack_id : 0
            }
            , app.handlers.packUpdate);
            
        });
        $('#a_pack_1').click(function() {
            app.session.pendingPack = 1;
            app.util.cookieCreate('pendingPack', app.session.pendingPack);
        
            window.location = config.pay_pack_1;
        });
        $('#a_pack_2').click(function() {
            app.session.pendingPack = 2;
            app.util.cookieCreate('pendingPack', app.session.pendingPack);
            
            window.location = config.pay_pack_2;
        });
        $('#a_pack_3').click(function() {
            app.session.pendingPack = 3;
            app.util.cookieCreate('pendingPack', app.session.pendingPack);
            
            window.location = config.pay_pack_3;
        });
    }

}

app.run = function(){
    app.session.firstKey = app.util.cookieRead('firstKey');
    app.session.token = app.util.cookieRead('token');
    app.session.pendingPack = app.util.cookieRead('pendingPack');
    
    if(null !== app.session.pendingPack){
        app.http.post('subscribers/pack',
        {
            token: app.session.token,
            pack_id : app.session.pendingPack
        }
        , app.handlers.packUpdate);
        
        app.session.pendingPack = null;
        app.util.cookieErase('pendingPack');
    }
    
    if(null !== app.session.token){
        app.pages.dash();
    } else if(null !== app.session.firstKey){
        app.pages.test();
    } else {
        app.pages.create();
    }
    
    app.http.geoIP();
}

app.run();