#!/bin/bash

# History.tsx 演示启动脚本 🚀
# 保持设计品位的优雅解决方案

echo "🎨 History.tsx 演示启动器"
echo "=========================="

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 函数：显示帮助信息
show_help() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  dev      启动 React 开发服务器"
    echo "  node     运行 Node.js 演示"
    echo "  universal 运行通用用法演示"
    echo "  build    构建 React 演示"
    echo "  preview  预览构建结果"
    echo "  all      运行所有演示"
    echo "  help     显示帮助信息"
}

# 函数：检查依赖
check_dependencies() {
    echo "${BLUE}📦 检查依赖...${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo "${YELLOW}⚠️  首次运行，正在安装依赖...${NC}"
        npm install
        echo "${GREEN}✅ 依赖安装完成${NC}"
    else
        echo "${GREEN}✅ 依赖已就绪${NC}"
    fi
}

# 函数：启动 React 开发服务器
start_dev() {
    echo "${BLUE}🚀 启动 React 开发服务器...${NC}"
    echo "${GREEN}   打开浏览器访问: http://localhost:3000${NC}"
    npm run dev
}

# 函数：运行 Node.js 演示
run_node() {
    echo "${BLUE}🖥️  运行 Node.js 演示...${NC}"
    npm run universal
}

# 函数：运行通用用法演示
run_universal() {
    echo "${BLUE}⚙️  运行通用用法演示...${NC}"
    npm run universal
}

# 函数：构建演示
build_demo() {
    echo "${BLUE}🏗️  构建演示项目...${NC}"
    npm run build
    echo "${GREEN}✅ 构建完成！${NC}"
}

# 函数：预览构建结果
preview_demo() {
    echo "${BLUE}👀 预览构建结果...${NC}"
    echo "${GREEN}   打开浏览器访问: http://localhost:4173${NC}"
    npm run preview
}

# 函数：运行所有演示
run_all() {
    echo "${GREEN}🎯 运行所有演示...${NC}"
    
    echo ""
    echo "${YELLOW}1️⃣  Node.js 演示${NC}"
    run_universal
    
    echo ""
    echo "${YELLOW}2️⃣  React 开发服务器${NC}"
    start_dev
}

# 主程序
main() {
    cd "$(dirname "$0")"
    
    case "$1" in
        "dev")
            check_dependencies
            start_dev
            ;;
        "node")
            check_dependencies
            run_node
            ;;
        "universal")
            check_dependencies
            run_universal
            ;;
        "build")
            check_dependencies
            build_demo
            ;;
        "preview")
            check_dependencies
            preview_demo
            ;;
        "all")
            check_dependencies
            run_all
            ;;
        "help"|"-h"|--help")
            show_help
            ;;
        "")
            echo "${GREEN}🎨 欢迎使用 History.tsx 演示！${NC}"
            echo ""
            echo "${BLUE}选择演示方式:${NC}"
            echo "  1) React 演示:    $0 dev"
            echo "  2) Node.js 演示:  $0 node"
            echo "  3) 通用用法:      $0 universal"
            echo "  4) 全部运行:      $0 all"
            echo ""
            echo "${YELLOW}输入 $0 help 查看更多选项${NC}"
            ;;
        *)
            echo "${RED}❌ 未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 捕获 Ctrl+C
trap 'echo "${YELLOW}\n👋 演示结束，感谢使用！${NC}"; exit 0' INT

# 运行主程序
main "$@" 2>/dev/null || {
    echo "${RED}❌ 运行失败，请确保已运行: npm install${NC}"
    echo "${BLUE}💡 尝试: cd examples/demo && npm install${NC}"
    exit 1
}

# 等待用户输入（如果直接运行）
if [ -t 0 ] && [ -z "$1" ]; then
    echo ""
    echo "${GREEN}按任意键继续...${NC}"
    read -n 1 -s
fi

exit 0

# 使用示例:
# ./run-demo.sh           # 显示帮助
# ./run-demo.sh dev       # 启动 React 界面
# ./run-demo.sh node      # 运行 Node.js 演示
# ./run-demo.sh all       # 运行所有演示
# ./run-demo.sh help      # 显示帮助信息