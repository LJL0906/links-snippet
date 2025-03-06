!macro customInstall
  DetailPrint "正在注册无限访问应用..."
  
  ; 设置开机自启动注册表项 - 添加--autostart参数
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "无限访问" '"$INSTDIR\无限访问.exe" --autostart'
  
  ; 创建开始菜单项
  CreateShortcut "$SMPROGRAMS\无限访问.lnk" "$INSTDIR\无限访问.exe"
  
  DetailPrint "安装完成!"
!macroend

!macro customUninstall
  DetailPrint "正在卸载无限访问应用..."
  
  ; 移除开机自启动
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "无限访问"
  
  DetailPrint "卸载完成!"
!macroend
