<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE xsl:stylesheet [
<!ENTITY nbsp "&#160;">
<!ENTITY copy "&#169;">
<!ENTITY raquo "»">
<!ENTITY laquo "«">
<!ENTITY mdash "–">
]>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  xmlns:exsl="http://exslt.org/common"
  xmlns:date="http://exslt.org/dates-and-times"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  xmlns:h="http://www.hathitrust.org"
  xmlns:svg="http://www.w3.org/2000/svg"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="h exsl date"
  extension-element-prefixes="exsl date">

  <xsl:variable name="timestamp" select="'?_=1548180869'" />
  <xsl:variable name="gTimestamp" select="date:time()" />

  <xsl:variable name="gFinalAccessStatus" select="/MBooksTp/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gHttpHost" select="/MBooksTop/MBooksGlobals/HttpHost"/>
  <xsl:variable name="gHtId" select="/MBooksTop/MBooksGlobals/HtId"/>

  <xsl:variable name="gLoggedIn" select="/MBooksTop/MBooksGlobals/LoggedIn"/>
  <xsl:variable name="gQ1" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']" />

  <xsl:variable name="gEnableGoogleAnalytics" select="'true'"/>

  <xsl:variable name="search-options">
      <!-- <option value="ocr" data-target="ls">Everything</option> -->
      <option value="all">All Fields</option>
      <!-- <option value="ocronly" data-target="ls">Just Full Text</option> -->
      <option value="title">Title</option>
      <option value="author">Author</option>
      <option value="subject">Subject</option>
      <option value="isbn">ISBN/ISSN</option>
      <option value="publisher">Publisher</option>
      <option value="seriestitle">Series Title</option>
  </xsl:variable>

  <!-- <xsl:template name="insert-svg-icons"> -->
  <xsl:variable name="gIcons" select="document('')//xsl:template[@name='insert-svg-icons']/svg" />

  <xsl:template name="load_base_js" />

  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <xsl:attribute name="data-analytics-code">
        <xsl:call-template name="get-analytics-code" />
      </xsl:attribute>
      <xsl:attribute name="data-analytics-enabled"><xsl:call-template name="get-analytics-enabled" /></xsl:attribute>
      <xsl:attribute name="data-tracking-category"><xsl:call-template name="get-tracking-category" /></xsl:attribute>
      <xsl:if test="//UserHasRoleToggles/@activated != ''">
        <xsl:attribute name="data-activated"><xsl:value-of select="//UserHasRoleToggles/@activated" /></xsl:attribute>
      </xsl:if>
      <xsl:call-template name="setup-html-data-attributes" />
      <xsl:attribute name="class">
        <xsl:text>no-js </xsl:text>
        <xsl:call-template name="search-target-class" />
        <xsl:call-template name="setup-html-class" />
      </xsl:attribute>
      <xsl:call-template name="setup-html-attributes" />

      <head>

        <xsl:comment>IE PRE-SETUP</xsl:comment>

        <xsl:call-template name="load_base_js"/>

        <!-- <script type="text/javascript" src="/common/unicorn/js/head.min.js"></script> -->
        <!-- <script type="text/javascript" src="/common/unicorn/js/common.js"></script> -->
        <!-- <script type="text/javascript" src="/common/alicorn/js/utils.js?_{$gTimestamp}"></script> -->

        <!-- <link rel="stylesheet" type="text/css" href="/common/unicorn/css/common.css{$timestamp}" /> -->
        <!-- <link rel="stylesheet" type="text/css" href="/common/alicorn/css/main.css?_{$gTimestamp}" /> -->

        <xsl:call-template name="build-js-link">
          <xsl:with-param name="href">/common/alicorn/js/utils.201910.js</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="build-css-link">
          <xsl:with-param name="href">/common/alicorn/css/main.201910.css</xsl:with-param>
        </xsl:call-template>

        <xsl:call-template name="setup-extra-header" />

        <xsl:comment>IE POST-SETUP</xsl:comment>

        <title>
          <xsl:call-template name="setup-page-title" />
        </title>

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <!-- <style>
          html[data-activated="ssdproxy"] body {
            filter: invert(1);
          }

          html[data-activated="ssdproxy"] a.action-switch-role {
            filter: invert(1);
            background: orange;
          }
        </style> -->

      </head>

      <body>
        <xsl:attribute name="class">
          <xsl:call-template name="setup-body-class" />
        </xsl:attribute>

        <xsl:call-template name="insert-svg-icons" />

        <xsl:call-template name="debug-messages" />

        <xsl:call-template name="skip-to-main-link" />

        <!-- <xsl:call-template name="access-overview" /> -->

        <div id="root">

          <div role="status" aria-atomic="true" aria-live="polite" class="offscreen"></div>

          <xsl:call-template name="navbar" />

          <xsl:call-template name="build-main-container" />

          <xsl:call-template name="footer" />
        </div>
        <xsl:call-template name="setup-body-tail" />
      </body>

    </html>

  </xsl:template>

  <xsl:template name="setup-body-tail"></xsl:template>

  <xsl:template name="skip-to-main-link" />

  <xsl:template name="setup-html-class" />
  <xsl:template name="setup-html-attributes" />
  <xsl:template name="setup-extra-header" />
  <xsl:template name="setup-body-class" />
  <xsl:template name="setup-html-data-attributes" />

  <xsl:template name="build-main-container">
    <main class="main-container" id="main">
      <xsl:call-template name="header" />
      <xsl:call-template name="page-contents" />
    </main>
  </xsl:template>

  <xsl:template name="access-overview">
    <div class="offscreen" rel="note">
      <h2>Text Only Views</h2>
      <xsl:if test="$gHtId">
        <p>Go to the <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only view of this item.</xsl:element></p>
      </xsl:if>
      <ul>
        <li>Special full-text views of publicly-available items are available to authenticated members of HathiTrust institutions.</li>
        <li>Special full-text views of in-copyright items may be available to authenticated members of HathiTrust institutions. Members should login to see which items are available while searching. </li>
        <li>See the <a href="https://www.hathitrust.org/accessibility">HathiTrust Accessibility</a> page for more information.</li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="access-overview-block">
    <div class="accessOverview" rel="note">
      <h3>Text Only Views</h3>
      <xsl:if test="$gHtId">
        <p>Go to the <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only view of this item.</xsl:element></p>
      </xsl:if>
      <ul>
        <li>Special full-text views of publicly-available items are available to authenticated members of HathiTrust institutions.</li>
        <li>Special full-text views of in-copyright items may be available to authenticated members of HathiTrust institutions. Members should login to see which items are available while searching. </li>
        <li>See the <a href="https://www.hathitrust.org/accessibility">HathiTrust Accessibility</a> page for more information.</li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="setup-page-title">
    <xsl:variable name="page-title">
      <xsl:call-template name="get-page-title" />
    </xsl:variable>
    <xsl:if test="normalize-space($page-title)">
      <xsl:value-of select="$page-title" /><xsl:text> | </xsl:text>
    </xsl:if>
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template>

  <xsl:template name="navbar">
    <header class="site-navigation" role="banner">
      <nav aria-label="about the site">
        <xsl:call-template name="navbar-site-links" />
        <ul id="person-nav" class="nav pull-right">
          <xsl:call-template name="navbar-user-links" />
        </ul>
      </nav>
      <xsl:call-template name="build-extra-header" />
    </header>
  </xsl:template>

  <xsl:template name="build-extra-header" />

  <xsl:template name="config-include-logo">FALSE</xsl:template>

  <xsl:template name="navbar-site-links">
    <ul id="nav" class="nav">
      <li>
        <a class="home-link" href="https://www.hathitrust.org">
          <span class="offscreen-for-narrowest">Home</span>
        </a>
      </li>
      <li class="menu nav-links">
        <a aria-expanded="false" class="menu" href="#" id="burger-menu"><i class="icomoon icomoon-reorder" aria-hidden="true"></i> Menu</a>
        <ul>
          <li class="menu">
            <a href="#" class="menu" aria-expanded="false" aria-haspopup="true" id="about-menu">About <span class="caret" aria-hidden="true"></span></a>
            <ul role="menu" aria-labelledby="about-menu" aria-hidden="true">
              <li><a href="https://www.hathitrust.org/about">Welcome to HathiTrust</a></li>
              <li><a href="https://www.hathitrust.org/partnership">Our Partnership</a></li>
              <li><a href="https://www.hathitrust.org/digital_library">Our Digital Library</a></li>
              <li><a href="https://www.hathitrust.org/collaborative-programs">Our Collaborative Programs</a></li>
              <li><a href="https://www.hathitrust.org/htrc">Our Research Center</a></li>
              <li><a href="https://www.hathitrust.org/news_publications">News &amp; Publications</a></li>
            </ul>
          </li>
          <xsl:if test="$gLoggedIn = 'YES'">
            <li><a href="{//Header/PrivCollLink}">My Collections</a></li>
          </xsl:if>
          <li><a href="/cgi/mb">Collections</a></li>
          <li class="help"><a href="https://www.hathitrust.org/help">Help</a></li>
          <xsl:call-template name="li-feedback" />
          <xsl:if test="false() and $gLoggedIn = 'YES'">
            <li class="on-for-narrowest"><a class="logout-link" href="{//Header/LoginLink}">Log out</a></li>
          </xsl:if>
        </ul>
      </li>
    </ul>
  </xsl:template>

  <xsl:template name="navbar-user-links">
    <li class="on-for-pt on-for-narrow">
      <button class="btn action-search-hathitrust control-search">
        <i class="icomoon icomoon-search" aria-hidden="true"></i><span class="offscreen-for-narrowest"> Search</span> HathiTrust</button>
    </li>
    <xsl:choose>
      <xsl:when test="$gLoggedIn = 'YES'">
        <xsl:choose>
          <xsl:when test="//Header/UserHasRoleToggles='TRUE'">
            <li class="x--off-for-narrowest">
              <xsl:variable name="debug">
                <xsl:if test="//Param[@name='debug']">?debug=<xsl:value-of select="//Param[@name='debug']" /></xsl:if>
              </xsl:variable>
              <a href="/cgi/ping/switch{$debug}" class="action-switch-role">
                <xsl:value-of select="//Header/UserAffiliation" />
                <xsl:text> </xsl:text>
                <xsl:text>⚡</xsl:text>
              </a>
            </li>
          </xsl:when>
          <xsl:otherwise>
            <li class="item-vanishing">
              <span>
                <xsl:value-of select="//Header/UserAffiliation" />
                <!-- ProviderName causes collisions with search navbar -->
                <!--
                <xsl:if test="//Header/ProviderName">
                  <xsl:text> (</xsl:text>
                  <xsl:value-of select="//Header/ProviderName" />
                  <xsl:text>)</xsl:text>
                </xsl:if>
                -->
              </span>
            </li>
          </xsl:otherwise>
        </xsl:choose>
        <li class="x--off-for-narrowest"><a class="logout-link" href="{//Header/LoginLink}">Log out</a></li>
      </xsl:when>
      <xsl:otherwise>
        <li><a id="login-link" class="trigger-login action-login" data-close-target=".modal.login" href="{//Header/LoginLink}">Log in</a></li>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="header">

    <div class="container container-medium flex-container container-header">
      <div class="logo">
        <a href="https://www.hathitrust.org">
          <span class="offscreen">HathiTrust Digital Library</span>
        </a>
      </div>
      <div id="search-modal-content" class="search-modal-content">
        <form id="ht-search-form" class="ht-search-form" method="GET" action="/cgi/ls/one">
          <div style="display: flex; flex-direction: row">
            <div style="flex-grow: 1">
              <div style="display: flex">
                <div class="control control-q1">
                  <label for="q1-input" class="offscreen">Search full-text index</label>
                  <input id="q1-input" name="q1" type="text" class="search-input-text" placeholder="Search words about or within the items" required="required" pattern="^(?!\s*$).+">
                    <xsl:attribute name="value">
                      <xsl:call-template name="header-search-q1-value" />
                    </xsl:attribute>
                  </input>
                </div>
                <div class="control control-searchtype">
                  <label for="search-input-select" class="offscreen">Search Field List</label>
                  <select id="search-input-select" size="1" class="search-input-select" name="searchtype" style="font-size: 1rem">
                    <xsl:call-template name="search-input-select-options" />
                  </select>
                </div>
              </div>
              <div class="global-search-options">
                <fieldset class="search-target">
                  <legend class="offscreen">Available Indexes</legend>
                  <input name="target" type="radio" id="option-full-text-search" value="ls" checked="checked" />
                  <label for="option-full-text-search" class="search-label-full-text">Full-text</label>
                  <input name="target" type="radio" id="option-catalog-search" value="catalog" />
                  <label for="option-catalog-search" class="search-label-catalog">Catalog</label>
                </fieldset>
                <xsl:call-template name="header-search-ft-checkbox" />
              </div>
            </div>
            <div style="flex-grow: 0">
              <div class="control">
                <button class="btn btn-primary" id="action-search-hathitrust"><i class="icomoon icomoon-search" aria-hidden="true"></i> Search HathiTrust</button>
              </div>
            </div>
          </div>
          <div class="global-search-links" style="padding-top: 1rem; margin-top: -1rem">
            <ul class="search-links">
              <li class="search-advanced-link">
                <a href="/cgi/ls?a=page;page=advanced">Advanced full-text search</a>
              </li>
              <li class="search-catalog-link">
                <a href="https://catalog.hathitrust.org/Search/Advanced">Advanced catalog search</a>
              </li>
              <li>
                <a href="https://www.hathitrust.org/help_digital_library#SearchTips">Search tips</a>
              </li>
            </ul>
          </div>
        </form>
      </div>
    </div>

  </xsl:template>

  <xsl:template name="header-search-form">
    <div class="search-form">
      <xsl:call-template name="global-search-form" />
    </div>
  </xsl:template>

  <xsl:template name="global-search-form">
    <form action="/cgi/ls/one" method="GET">
      <div class="search-tabs" role="radiogroup" aria-labelledby="search-tabs-label">
        <span id="search-tabs-label" class="offscreen">Search this index</span>
        <xsl:call-template name="header-search-tabs" />
      </div>
      <xsl:call-template name="global-search-form-fieldset" />
      <xsl:call-template name="global-search-form-options" />
    </form>
  </xsl:template>

  <xsl:template name="global-search-form-fieldset">
    <fieldset>
      <label for="q1-input" class="offscreen" >Search</label>
      <input id="q1-input" name="q1" type="text" class="search-input-text" placeholder="Search words about or within the items">
        <xsl:attribute name="value">
          <xsl:call-template name="header-search-q1-value" />
        </xsl:attribute>
      </input>
      <div class="search-input-options">
        <label for="search-input-select" class="offscreen">Search Field List</label>
        <select id="search-input-select" size="1" class="search-input-select" name="searchtype">
          <xsl:call-template name="search-input-select-options" />
        </select>
      </div>
      <button class="button"><span class="offscreen">Search</span></button>
    </fieldset>
  </xsl:template>

  <xsl:template name="global-search-form-options">
    <div class="search-extra-options">
      <ul class="search-links">
        <li class="search-advanced-link">
          <a>
            <xsl:attribute name="href">
              <xsl:call-template name="GetAdvancedFullTextHref"/>
            </xsl:attribute>
            <xsl:text>Advanced full-text search</xsl:text>
          </a>
        </li>
        <li class="search-catalog-link"><a href="https://catalog.hathitrust.org/Search/Advanced">Advanced catalog search</a></li>
        <li><a href="https://www.hathitrust.org/help_digital_library#SearchTips">Search tips</a></li>
      </ul>
      <xsl:call-template name="header-search-ft-checkbox" />
    </div>
  </xsl:template>

  <xsl:template name="GetAdvancedFullTextHref">
    <xsl:text>/cgi/ls?a=page;page=advanced</xsl:text>
  </xsl:template>


  <xsl:template name="header-search-q1-value" />

  <xsl:template name="footer">
    <!-- <xsl:variable name="inst" select="/MBooksTop/MBooksGlobals/InstitutionName"/> -->
    <xsl:variable name="inst">University At Buffalo, The State University of New York</xsl:variable>
    <footer class="site-navigation" role="contentinfo">
      <nav>
        <xsl:if test="false() and $inst != ''">
          <ul class="nav">
            <li>
              <span class="institution-label" aria-label="${inst}" data-role="tooltip" data-microtip-position="top" data-microtip-size="small"><xsl:value-of select="$inst" /></span>
              <!-- <span style="font-size: 0.8rem"><xsl:value-of select="$inst" /><br />HathiTrust
              </span> -->
            </li>
          </ul>
        </xsl:if>
        <ul class="nav pull-right">
          <li><a href="https://www.hathitrust.org/">Home</a></li>
          <li><a href="https://www.hathitrust.org/about">About</a></li>
          <li><a href="/cgi/mb">Collections</a></li>
          <li><a href="https://www.hathitrust.org/help">Help</a></li>
          <xsl:call-template name="li-feedback" />
          <!-- <li><a href="https://m.hathitrust.org">Mobile</a></li> -->
          <li><a href="https://www.hathitrust.org/accessibility">Accessibility</a></li>
          <li><a href="https://www.hathitrust.org/take_down_policy">Take-Down Policy</a></li>
          <li><a href="https://www.hathitrust.org/privacy">Privacy</a></li>
          <li><a href="https://www.hathitrust.org/contact">Contact</a></li>
        </ul>
      </nav>
    </footer>
  </xsl:template>

  <xsl:template name="li-feedback">
    <xsl:variable name="feedback-id">
      <xsl:call-template name="get-feedback-id" />
    </xsl:variable>
    <xsl:variable name="feedback-m">
      <xsl:call-template name="get-feedback-m" />
    </xsl:variable>
    <li><a href="/cgi/feedback?page=form" data-m="{$feedback-m}" data-toggle="feedback tracking-action" data-id="{$feedback-id}" data-tracking-action="Show Feedback">Feedback</a></li>
  </xsl:template>

  <xsl:template name="get-feedback-id">HathiTrust (babel)</xsl:template>
  <xsl:template name="get-feedback-m">ht</xsl:template>

  <xsl:template name="page-contents">
    <xsl:call-template name="contents" />
  </xsl:template>

  <xsl:template name="get-page-contents" />

  <xsl:template name="login-block">
    <div class="login">
      <xsl:choose>
        <xsl:when test="$gLoggedIn = 'YES'">
          <!-- we don't do anything normally -->
        </xsl:when>
        <xsl:otherwise>
          <a href="{/MBooksTop/Header/LoginLink}" id="login-button" class="button log-in">LOG IN</a>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="header-search-tabs">
    <xsl:variable name="target">
      <xsl:call-template name="header-search-target" />
    </xsl:variable>
    <input name="target" type="radio" id="option-full-text-search" value="ls">
      <xsl:if test="$target = 'ls'">
        <xsl:attribute name="checked">checked</xsl:attribute>
      </xsl:if>
    </input>
    <label for="option-full-text-search" class="search-label-full-text">Full-text</label>
    <input name="target" type="radio" id="option-catalog-search" value="catalog">
      <xsl:if test="$target = 'catalog'">
        <xsl:attribute name="checked">checked</xsl:attribute>
      </xsl:if>
    </input>
    <label for="option-catalog-search" class="search-label-catalog">Catalog</label>
  </xsl:template>

  <!-- default to ls -->
  <xsl:template name="search-target-class">
    <xsl:variable name="class">
      <xsl:text>search-target-</xsl:text><xsl:call-template name="header-search-target" />
    </xsl:variable>
    <xsl:value-of select="normalize-space($class)" />
  </xsl:template>
  <xsl:template name="header-search-target">ls</xsl:template>

  <xsl:template name="search-input-select-options">
    <xsl:for-each select="exsl:node-set($search-options)/*">
      <option value="{@value}">
        <xsl:if test="@data-target">
          <xsl:attribute name="data-target"><xsl:value-of select="@data-target" /></xsl:attribute>
        </xsl:if>
        <xsl:call-template name="header-search-options-selected">
          <xsl:with-param name="value" select="@value" />
        </xsl:call-template>
        <xsl:value-of select="." />
      </option>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="header-search-options-selected" />

  <xsl:template name="header-search-ft-checkbox">
    <xsl:variable name="checked">
      <xsl:call-template name="header-search-ft-value" />
    </xsl:variable>
    <div class="global-search-ft">
      <input type="checkbox" name="ft" value="ft" id="global-search-ft">
        <xsl:if test="normalize-space($checked)">
          <xsl:attribute name="checked">checked</xsl:attribute>
        </xsl:if>
      </input>
      <label for="global-search-ft">Full view only</label>
    </div>
  </xsl:template>

  <xsl:template name="header-search-ft-value">checked</xsl:template>

  <xsl:template name="list-surveys">
    <xsl:call-template name="list-surveys-blocks" />
<!--     <xsl:choose>
      <xsl:when test="contains(//Param[@name='debug'], 'blocks')">
        <xsl:call-template name="list-surveys-blocks" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="list-surveys-combined" />
      </xsl:otherwise>
    </xsl:choose> -->
  </xsl:template>

  <xsl:template name="list-surveys-blocks">
    <xsl:for-each select="//Surveys/Survey">
      <div class="alert alert-notice alert-block">
        <xsl:if test=".//a[@dir]">
          <xsl:attribute name="dir"><xsl:value-of select=".//a/@dir" /></xsl:attribute>
        </xsl:if>
        <p>
          <xsl:apply-templates select="Desc" mode="copy-guts" />
        </p>
      </div>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="list-surveys-combined">
    <div class="alert alert-notice alert-block">
      <xsl:for-each select="//Surveys/Survey">
        <p>
          <xsl:if test="position() &gt; 1">
            <xsl:attribute name="style">margin-top: 20px</xsl:attribute>
          </xsl:if>
          <xsl:apply-templates select="Desc" mode="copy-guts" />
        </p>
      </xsl:for-each>
    </div>
  </xsl:template>

  <xsl:template name="debug-messages">
    <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages/*">
      <div class="debug-messages">
        <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*" />
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="get-analytics-enabled">true</xsl:template>
  <xsl:template name="get-analytics-code">
    <xsl:text>UA-954893-23</xsl:text>
    <xsl:call-template name="get-extra-analytics-code" />
  </xsl:template>
  <xsl:template name="get-extra-analytics-code"></xsl:template>
  <xsl:template name="get-tracking-category">HT</xsl:template>

  <xsl:template name="insert-svg-icons">
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none">
      <symbol id="checkbox-empty" viewBox="0 0 18 18">
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-61.000000, -957.000000)"><g transform="translate(60.000000, 918.000000)"><g transform="translate(0.000000, 38.000000)"><path d="M16.9994,0.99807 L2.99939,0.99807 C1.89439,0.99807 0.99939,1.89307 0.99939,2.99807 L0.99939,16.9981 C0.99939,18.1031 1.89439,18.9981 2.99939,18.9981 L16.9994,18.9981 C18.1034,18.9981 18.9994,18.1031 18.9994,16.9981 L18.9994,2.99807 C18.9994,1.89307 18.1034,0.99807 16.9994,0.99807 L16.9994,0.99807 Z M16.9994,2.99807 L16.9994,16.9981 L2.99939,16.9991 L2.99939,2.99807 L16.9994,2.99807 L16.9994,2.99807 Z"></path></g></g></g></g>
      </symbol>
      <symbol id="checkbox-checked" viewBox="0 0 18 18" version="1.1"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-240.000000, -957.000000)"><g transform="translate(60.000000, 918.000000)"><g transform="translate(179.000000, 38.000000)"><path d="M7.9994,14.9981 L2.9994,9.9981 L4.4134,8.5841 L7.9994,12.1701 L15.5854,4.58407 L16.9994,5.99807 L7.9994,14.9981 Z M16.9994,0.99807 L2.9994,0.99807 C1.8934,0.99807 0.9994,1.89307 0.9994,2.99807 L0.9994,16.9981 C0.9994,18.1031 1.8934,18.9981 2.9994,18.9981 L16.9994,18.9981 C18.1044,18.9981 18.9994,18.1031 18.9994,16.9981 L18.9994,2.99807 C18.9994,1.89307 18.1044,0.99807 16.9994,0.99807 L16.9994,0.99807 Z"></path></g></g></g></g></symbol>
      <symbol id="panel-expanded" viewBox="0 0 14 2">
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g transform="translate(-823.000000, -212.000000)">
            <g transform="translate(822.000000, 60.000000)">
              <g transform="translate(0.000000, 151.000000)">
                <polygon points="14.9994 2.998 0.99943 2.998 0.99995 1.0001 14.9994 0.998"></polygon>
              </g>
            </g>
          </g>
        </g>
      </symbol>
      <symbol id="panel-collapsed" viewBox="0 0 12 8"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-353.000000, -585.000000)"><g transform="translate(60.000000, 477.000000)"><g transform="translate(292.000000, 108.000000)"><polygon points="2.41348 0.58407 6.9995 5.1701 11.5855 0.58407 12.9995 1.99807 6.9995 7.9981 0.99948 1.99807"></polygon></g></g></g></g></symbol>
      <symbol id="action-remove" viewBox="0 0 14 14" class="active-filter-symbol">
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g transform="translate(-274.000000, -993.000000)">
            <g transform="translate(60.000000, 918.000000)">
              <g transform="translate(214.000000, 75.000000)">
                <polygon points="14 1.41 12.59 0 7 5.59 1.41 0 0 1.41 5.59 7 0 12.59 1.41 14 7 8.41 12.59 14 14 12.59 8.41 7"></polygon>
              </g>
            </g>
          </g>
        </g>
      </symbol>
      <symbol
         className="svg"
         fill="currentColor"
         preserveAspectRatio="xMidYMid meet"
         height="16"
         width="16"
         viewBox="0 0 16 16"
         id="radio-empty"
      >
         <circle
            className="radioOutline"
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke="black"
            stroke-width="2.5"
         />
      </symbol>
      <symbol
         className="svg"
         fill="currentColor"
         preserveAspectRatio="xMidYMid meet"
         height="16"
         width="16"
         viewBox="0 0 16 16"
         id="radio-checked"
      >
         <circle
            className="radioOutline"
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke="black"
            stroke-width="2.5"
         />
         <circle
            className="radioDot"
            cx="8"
            cy="8"
            r="3.5"
            fill="black"
         />
      </symbol>
      <xsl:call-template name="insert-svg-icons-extra" />
    </svg>
  </xsl:template>

  <xsl:template name="insert-svg-icons-extra" />

  <xsl:template name="build-icon">
    <xsl:param name="id" />
    <svg xmlns="http://www.w3.org/2000/svg" class="icon">
      <xsl:apply-templates select="$gIcons//svg:symbol[@id=$id]" mode="copy-guts" />
    </svg>
  </xsl:template>

  <xsl:template name="build-css-link">
    <xsl:param name="href" />
    <xsl:variable name="modtime" select="//Timestamp[@href=$href]/@modtime" />
    <link rel="stylesheet" href="{$href}?_{$modtime}" />
  </xsl:template>

  <xsl:template name="build-js-link">
    <xsl:param name="href" />
    <xsl:variable name="modtime" select="//Timestamp[@href=$href]/@modtime" />
    <script type="text/javascript" src="{$href}?_{$modtime}"></script>
  </xsl:template>

  <xsl:template match="node()" mode="copy-guts">
    <xsl:apply-templates select="@*|*|text()" mode="copy" />
  </xsl:template>

  <xsl:template match="node()[name()]" mode="copy" priority="10">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:element>
  </xsl:template>

  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
