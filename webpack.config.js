const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  // 使用production模式减少eval使用
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    // 修改输出文件名模式，防止冲突
    filename: '[name].bundle.js',
    publicPath: '/dist/'
  },
  // 使用source-map而不是eval-source-map
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      os: false
    }
  },
  externals: {
    electron: 'commonjs electron'
  },
  target: 'electron-renderer',
  // 修改优化配置解决冲突问题
  optimization: {
    minimize: true,
    // 修改分块策略
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          // 确保vendor块优先级高于默认
          priority: 10
        }
      }
    }
  }
}
