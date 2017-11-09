function startApp() {
    const baseUrl = "https://baas.kinvey.com/";
    const appKey = "kid_BJmxpucmx";
    const appSecret = "75229b00f784463b9f934337f78356d8";
    const kinveyAuthHeaders = {
        'Authorization': "Basic " +
        btoa(appKey + ":" + appSecret),
    };

    if (sessionStorage.length === 0) {
        loggedOutView();
    } else {
        loggedInView();
    }

    $('#infoBox').hide();
    $('#errorBox').hide();
    $('#loadingBox').hide();

    function loggedOutView() {
        $('main > section').hide();
        $('#viewAppHome').show();
        loggedOutNav();
    }

    function loggedInView() {
        $('main > section').hide();
        $('#viewAppHome').show();
        loggedInNav();
    }

    function loggedOutNav() {
        $('#menu a').hide();
        $('#spanMenuLoggedInUser').hide();

        $('#linkMenuAppHome').show();
        $('#linkMenuLogin').show();
        $('#linkMenuRegister').show();
    }

    function loggedInNav() {
        $('#menu a').show();

        $('#linkMenuAppHome').hide();
        $('#linkMenuLogin').hide();
        $('#linkMenuRegister').hide();
        $('#spanMenuLoggedInUser').show();
    }

    $('#linkMenuAppHome').on('click', viewHome);
    $('#linkMenuLogin').on('click', viewLogin);
    $('#linkMenuRegister').on('click', viewRegister);
    $('#linkMenuUserHome').on('click', viewUserHome);
    $('#linkMenuMyMessages,#linkUserHomeMyMessages').on('click', viewMyMessages);
    $('#linkMenuArchiveSent,#linkUserHomeArchiveSent').on('click', viewArchiveSent);
    $('#linkMenuSendMessage,#linkUserHomeSendMessage').on('click', viewSendMessage);
    $('#linkMenuLogout').on('click', ajaxLogout);

    $('#formSendMessage').on('submit', ajaxSendMessage);

    function ajaxLogout() {
        $.ajax({
            method: "POST",
            url: baseUrl + 'user/' + appKey + "/_logout",
            headers: {Authorization: "Kinvey " + sessionStorage.getItem('token')},
            success: logoutSuccess,
            error: handleAjaxError
        });

        function logoutSuccess() {
            sessionStorage.clear();
            showSuccess('Logout successful.');
            loggedOutView();
        }
    }

    function ajaxSendMessage(e) {
        e.preventDefault();
        let selectedOption = $('#msgRecipientUsername option:selected');
        let optionId = selectedOption.attr('data-id');
        let data = {
            sender_username: sessionStorage.getItem('userName'),
            sender_name: sessionStorage.getItem('name'),
            recipient_username: selectedOption.attr('value'),
            text: $('#msgText').val()
        };

        $.ajax({
            method: "POST",
            url: baseUrl + "appdata/" + appKey + "/messages/",
            headers: {Authorization: "Kinvey " + sessionStorage.getItem('authToken')},
            data: data,
            success: messageSendSuccess,
            error: handleAjaxError
        });

        function messageSendSuccess() {
            showSuccess('Message sent.');
        }
    }

    function viewSendMessage() {
        hideSections();
        $('#viewSendMessage').show();

        $.ajax({
            method: "GET",
            url: baseUrl + "user/" + appKey,
            headers: {Authorization: "Kinvey " + sessionStorage.getItem('authToken')},
            success: getUsersSuccess,
            error: handleAjaxError
        });

        function getUsersSuccess(response) {
            let select = $('#msgRecipientUsername');
            select.empty();
            for (let user of response) {
                let option = $(`<option data-id="${user._id}" value="${user.username}"></option>`);
                option.text(`${user.name} (${user.username})`);
                select.append(option);
            }
        }
    }

    function viewArchiveSent() {
        hideSections();
        $('#viewArchiveSent').show();

        $.ajax({
            method: "GET",
            url: baseUrl + `appdata/${appKey}/messages?query={"sender_username":"${sessionStorage.getItem('userName')}"}`,
            headers: {Authorization: "Kinvey " + sessionStorage.getItem('authToken')},
            success: getSendMessagesSuccess,
            error: handleAjaxError
        });

        function getSendMessagesSuccess(messages) {
            let table = $('#sentMessages table');
            let tableBody = table.find('tbody');
            tableBody.empty();
            for (let msg of messages) {
                let tr = $('<tr>');
                tr.attr('data-message-id', msg._id);
                let tdTo = $('<td>');
                tdTo.text(`${msg.recipient_username}`);
                let tdText = $('<td>');
                tdText.text(`${msg.text}`);
                let date = formatDate(msg._kmd.ect);
                let tdDate = $(`<td>${date}</td>`);

                let actionsTd = $('<td>');
                let deleteBtn = $('<button>Delete</button>');

                actionsTd.append(deleteBtn.click(deleteElement));

                tr.append(tdTo);
                tr.append(tdText);
                tr.append(tdDate);
                tr.append(actionsTd);

                tableBody.append(tr);
            }
        }
    }

    function deleteElement() {
        let currentId = $(this).parent().parent().attr('data-message-id');

        $.ajax({
            method: "DELETE",
            url: baseUrl + "appdata/" + appKey + "/messages/" + currentId,
            headers: {Authorization: "Kinvey "+ sessionStorage.getItem('authToken')},
            success: elementDeletedSuccess,
            error: handleAjaxError
        });

        function elementDeletedSuccess() {
            showSuccess("Message deleted.");
            viewArchiveSent();
        }
    }

    function viewMyMessages() {
        hideSections();
        $('#viewMyMessages').show();

        $.ajax({
            method: "GET",
            url: baseUrl + `appdata/${appKey}/messages?query={"recipient_username":"${sessionStorage.getItem('userName')}"}`,
            headers: {Authorization: "Kinvey " + sessionStorage.getItem('authToken')},
            success: getMessagesSuccess,
            error: handleAjaxError
        });

        function getMessagesSuccess(response) {
            let table = $('#myMessages table');
            table.find('tbody').empty();
            let tbody = $('<tbody>');
            for (let message of response) {
                let tr = $('<tr>');
                let newDate = formatDate(message._kmd.ect);
                let tdDate = $('<td>').text(newDate);
                let sender = formatSender(message.sender_name, message.sender_username);
                let tdSender = $('<td>').text(sender);
                let messageTxt = message.text;
                let tdMsg = $('<td>').text(messageTxt);

                tr.append(tdSender);
                tr.append(tdMsg);
                tr.append(tdDate);

                tbody.append(tr);
            }
            table.append(tbody);
        }
    }

    function viewUserHome() {
        hideSections();
        $('#viewUserHome').show();
    }

    function viewHome() {
        hideSections();
        $('#viewAppHome').show()
    }

    function viewLogin() {
        hideSections();
        $('#viewLogin').show();
    }

    function viewRegister() {
        hideSections();
        $('#viewRegister').show();
    }

    function hideSections() {
        $('main > section').hide();
    }

    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });

    $('#formLogin').on('submit', ajaxLogin);
    $('#formRegister').on('submit', ajaxRegister);

    function ajaxLogin(e) {
        e.preventDefault();
        let data = {
            username: $('#loginUsername').val(),
            password: $('#loginPasswd').val()
        };

        $.ajax({
            method: "POST",
            url: baseUrl + "user/" + appKey + "/login",
            headers: kinveyAuthHeaders,
            data: data,
            success: loginSuccess,
            error: handleAjaxError
        });

        function loginSuccess(response) {
            showSuccess('Login successful.');
            let userAuth = response._kmd.authtoken;
            sessionStorage.setItem('authToken', userAuth);
            sessionStorage.setItem('userId', response._id);
            sessionStorage.setItem('token', response._kmd.authtoken);
            sessionStorage.setItem('userName', response.username);
            sessionStorage.setItem('name', response.name);
            $('#spanMenuLoggedInUser').text(`Welcome, ${response.username}!`);
            loggedInNav();
            viewUserHome();
        }
    }

    function viewUserHome() {
        hideSections();
        $('#viewUserHome').show();
        $('#viewUserHomeHeading').text(`Welcome, ${sessionStorage.getItem('userName')}!`);
    }

    function ajaxRegister(e) {
        e.preventDefault();
        let data = {
            username: $('#registerUsername').val(),
            password: $('#registerPasswd').val(),
        };

        let registerName = $('#registerName').val();
        if (registerName != '') {
            data['name'] = registerName;
        }

        $.ajax({
            method: "POST",
            url: baseUrl + "user/" + appKey + "/",
            headers: kinveyAuthHeaders,
            data: data,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess() {
            showSuccess('User registration successful.');
            viewLogin();
        }
    }

    function showSuccess(text) {
        $('#infoBox').text(text).show().fadeOut(2000);
    }

    function handleAjaxError(error) {
        let errorBox = $('#errorBox');
        let errorObj = JSON.parse(error.responseText);
        let description = errorObj.description;
        errorBox.text(description).show();
        errorBox.click(function () {
            errorBox.hide();
        });
    }

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }


}