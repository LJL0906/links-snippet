!macro customInstall
  DetailPrint "正在注册infinite-Links应用..."
  
  ; 设置开机自启动注册表项 - 添加--autostart参数
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "infinite-Links" '"$INSTDIR\infinite-Links.exe" --autostart'
  
  ; 创建开始菜单项
  CreateShortcut "$SMPROGRAMS\infinite-Links.lnk" "$INSTDIR\infinite-Links.exe"
  
  DetailPrint "安装完成!"
!macroend

!macro customUninstall
  DetailPrint "正在卸载infinite-Links应用..."
  
  ; 移除开机自启动
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "infinite-Links"
  
  DetailPrint "卸载完成!"
!macroend
