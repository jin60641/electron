'use strict';

const {app,BrowserWindow,Menu,Tray,ipcMain,shell,dialog} = require('electron');
var path = require('path');

        
app.on('ready', function(){
    const win = new BrowserWindow({	
        width : 650,
        height : 650,
        resizable : false,
        icon : path.join(__dirname, "img/favicon.png"),
        title : "html파싱&음원추출",
        show : false
    });
    
    const trayTemplate = [
        {
            label: '열기',
            type: 'normal',
            click : function(){
                showWin();
            }
        },{
            label : '감추기',
            type : 'normal',
            click : function(){
                hideWin();
            }
        },{
            type: 'separator'
        },{
            label: '종료',
            type: 'normal',
            click: function(){
                app.exit();
            }
        }
    ];
    const menuTemplate = [
        {
            label: '감추기',
            click : function(){
                hideWin();
            }
        },{
            type: 'separator'
        },{
            label: '종료',
            click : function(){
                app.exit();
            }
        }
    ];
    win.loadURL(path.join('file://',__dirname,'index.html'));
    const tray = new Tray( path.join(__dirname, "img/favicon.png") );    
    const trayMenu = Menu.buildFromTemplate(trayTemplate);
    tray.setContextMenu(trayMenu);

    tray.on('double-click', function(){
        showWin();
    });

    win.on('ready-to-show', function(){
		win.show();
	});
    win.on('close', function( event ){      
        event.preventDefault();
        hideWin();
        return false;
    });

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    ipcMain.on('getaudio',function(evt,vid){
        require('./parse.js').getAudio(vid, function(result){ 
            evt.sender.send('getaudio_success', result );
        });
    });
    ipcMain.on('parse', function(evt,url){
        require('./parse.js').Parse(url, function(result){
            if( typeof result != "string" ){
                result.url = url;
            }
            evt.sender.send('parse_success', result );
        });
    });
    
	function showWin() {
        if (win !== null) {
            win.show();
        }
    }
    function hideWin() {
        if (win !== null) {
            win.hide();
        }
    }
});


app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.exit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})

app.on('quit', function(){
});
