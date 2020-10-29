<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <!-- Global Variables -->
  <xsl:variable name="gOrphanCandidate" select="/MBooksTop/MBooksGlobals/OrphanCandidate"/>
  <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gCurrentQ1" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
  <xsl:variable name="gFeatureList" select="/MBooksTop/MdpApp/FeatureList"/>
  <xsl:variable name="gBackNavLinkType" select="/MBooksTop/MdpApp/BackNavInfo/Type"/>
  <xsl:variable name="gBackNavLinkHref" select="/MBooksTop/MdpApp/BackNavInfo/Href"/>
  <xsl:variable name="gSSD_Session" select="/MBooksTop/MBooksGlobals/SSDSession"/>
  <xsl:variable name="gUserName" select="/MBooksTop/Header/UserName"/>
  <xsl:variable name="gInCopyright" select="/MBooksTop/MBooksGlobals/InCopyright"/>
  <xsl:variable name="gHeld" select="/MBooksTop/MBooksGlobals/Holdings/Held"/>
  <xsl:variable name="gBrittleHeld" select="/MBooksTop/MBooksGlobals/Holdings/BrittleHeld"/>
  <xsl:variable name="gImgsrvUrlRoot" select="/MBooksTop/MBooksGlobals/UrlRoots/Variable[@name='cgi/imgsrv']"/>
  <xsl:variable name="gItemType" select="/MBooksTop/MBooksGlobals/ItemType" />
  <xsl:variable name="gHTDEV" select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>
  <xsl:variable name="gSuppressAccessBanner" select="/MBooksTop/MBooksGlobals/SuppressAccessBanner"/>

  <xsl:variable name="etas_href">https://www.hathitrust.org/ETAS-User-Information</xsl:variable>

  <xsl:variable name="gIsCRMS">
    <xsl:choose>
      <xsl:when test="contains(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='skin'], 'crms')">true</xsl:when>
      <xsl:otherwise>false</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gCurrentUi">
    <xsl:choose>
      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']">
        <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>reader</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gCurrentReaderMode">full</xsl:variable>

  <xsl:template name="load_concat_js_file" />
  <xsl:template name="load_uncompressed_js" />

  <xsl:template name="setup-html-class">
    <xsl:if test="$gHTDEV != ''">
      <xsl:text> htdev </xsl:text>
    </xsl:if>
    <xsl:if test="$gIsCRMS = 'true'">
      <xsl:text> crms </xsl:text>
    </xsl:if>
    <xsl:choose>
      <xsl:when test="//Param[@name='skin']">
        <xsl:text> skin-</xsl:text><xsl:value-of select="//Param[@name='skin']" />
      </xsl:when>
      <xsl:otherwise><xsl:text> skin-default</xsl:text></xsl:otherwise>
    </xsl:choose>
    <xsl:call-template name="setup-login-status-class" />
    <xsl:call-template name="setup-extra-html-class" />
  </xsl:template>

  <xsl:template name="setup-login-status-class">
    <xsl:if test="$gLoggedIn = 'YES'">
      <xsl:text> logged-in </xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-html-attributes">
    <xsl:variable name="ns">
      <dc:elem xmlns:dc="http://purl.org/dc/elements/1.1/" />
      <cc:elem xmlns:cc="http://creativecommons.org/ns#" />
      <foaf:elem xmlns:foaf="http://xmlns.com/foaf/0.1" />
    </xsl:variable>
    <xsl:copy-of select="exsl:node-set($ns)/*/namespace::*" />
    <xsl:attribute name="version">XHTML+RDFa 1.0</xsl:attribute>
    <xsl:attribute name="data-content-provider"><xsl:value-of select="/MBooksTop/MBooksGlobals/ContentProvider" /></xsl:attribute>
    <xsl:if test="//CurrentCgi/Param[@name='page'] = 'root' and //FinalAccessStatus = 'allow'">
      <xsl:attribute name="data-analytics-skip">true</xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-app">pt</xsl:attribute>
    <xsl:call-template name="setup-extra-html-attributes" />
  </xsl:template>

  <xsl:template name="setup-extra-html-attributes" />
  <xsl:template name="setup-extra-html-class" />

  <xsl:template name="header-search-q1-value">
    <xsl:value-of select="//HeaderSearchParams/Field[@name='q1']" />
  </xsl:template>

  <xsl:template name="header-search-ft-value">
    <xsl:choose>
      <xsl:when test="//HeaderSearchParams/Field[@name='ft']">
        <xsl:value-of select="//HeaderSearchParams/Field[@name='ft']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>checked</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:variable name="header-search-params-searchtype" select="//HeaderSearchParams/Field[@name='searchtype']" />

  <xsl:template name="header-search-options-selected">
    <xsl:param name="value" />
    <xsl:choose>
      <xsl:when test="$value = $header-search-params-searchtype">
        <xsl:attribute name="selected">selected</xsl:attribute>
      </xsl:when>
      <xsl:otherwise>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="header-search-target">
    <xsl:choose>
      <xsl:when test="//HeaderSearchParams/Field[@name='target']">
        <xsl:value-of select="//HeaderSearchParams/Field[@name='target']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>ls</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <meta name="robots" content="noarchive" />

    <xsl:call-template name="setup-social-twitter" />
    <xsl:call-template name="setup-social-facebook" />

    <xsl:element name="link">
      <xsl:attribute name="rel">canonical</xsl:attribute>
      <xsl:attribute name="href">
        <xsl:text>https://babel.hathitrust.org/cgi/pt?id=</xsl:text>
        <xsl:value-of select="$gHtId" />
      </xsl:attribute>
    </xsl:element>

    <xsl:text disable-output-escaping="yes">
    <![CDATA[<!--[if lte IE 8]><link rel="stylesheet" type="text/css" href="/pt/css/ie8.css" /><![endif]-->]]>
    </xsl:text>

    <script>
      var HT = HT || {};
      <xsl:value-of select="//ApplicationParams" />
      HT.params.download_progress_base = '<xsl:value-of select="//DownloadProgressBase" />';
      HT.params.RecordURL = '<xsl:value-of select="concat('https://catalog.hathitrust.org/Record/', $gCatalogRecordNo)" />';
    </script>

    <!-- <script type="text/javascript" src="/pt/alicorn/js/utils.js"></script> -->
    <xsl:call-template name="build-js-link">
      <xsl:with-param name="href">/pt/alicorn/js/utils.js</xsl:with-param>
    </xsl:call-template>

    <!-- <xsl:call-template name="load_js_and_css"/> -->
    <xsl:call-template name="include_local_javascript" />

    <xsl:call-template name="setup-extra-header-extra" />
  </xsl:template>

  <xsl:template name="setup-social-twitter">
    <meta name="twitter:card">
      <xsl:attribute name="content">
        <xsl:choose>
          <xsl:when test="//CurrentPageImageSource">
            <xsl:text>summary_large_image</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>summary</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
    </meta>
    <meta name="twitter:site" content="@HathiTrust" />
    <meta name="twitter:url">
      <xsl:attribute name="content">
        <xsl:call-template name="get-sharable-handle-link" />
      </xsl:attribute>
    </meta>
    <meta name="twitter:description">
      <xsl:attribute name="content">
        <xsl:call-template name="GetMaybeTruncatedTitle">
          <xsl:with-param name="titleString" select="$gTitleString"/>
          <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
          <xsl:with-param name="maxLength" select="128"/>
        </xsl:call-template>
      </xsl:attribute>
    </meta>

    <xsl:if test="//CurrentPageImageSource">
      <meta name="twitter:image" content="{//CurrentPageImageSource}" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-social-facebook">
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="HathiTrust" />
    <meta property="og:url">
      <xsl:attribute name="content">
        <xsl:call-template name="get-sharable-handle-link" />
      </xsl:attribute>
    </meta>
    <meta property="og:title">
      <xsl:attribute name="content">
        <xsl:call-template name="GetMaybeTruncatedTitle">
          <xsl:with-param name="titleString" select="$gTitleString"/>
          <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
          <xsl:with-param name="maxLength" select="128"/>
        </xsl:call-template>
      </xsl:attribute>
    </meta>

    <xsl:if test="//CurrentPageImageSource">
      <meta property="og:image" content="{//CurrentPageImageSource}" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
  </xsl:template>

  <xsl:template name="setup-extra-header-extra" />

  <!-- <xsl:template name="header" /> -->

  <xsl:template name="build-extra-header">
    <xsl:variable name="access-type" select="//AccessType" />
    <xsl:if test="$gFinalAccessStatus='allow' and $gInCopyright='true'">
      <xsl:if test="$access-type/Name = 'emergency_access_affiliate'">
        <xsl:call-template name="build-emergency-access-affiliate-header" />
      </xsl:if>
      <xsl:if test="$access-type/Name = 'in_library_user'">
        <xsl:call-template name="build-in-library-user-header" />
      </xsl:if>
      <xsl:if test="$gLoggedIn='YES' and $gSSD_Session='true'">
        <xsl:call-template name="build-ssd-session-header" />
      </xsl:if>
      <xsl:if test="$access-type/Name = 'enhanced_text_user'">
        <xsl:call-template name="build-ssd-session-header" />
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-emergency-access-affiliate-header">
    <xsl:variable name="access-type" select="//AccessType" />
    <div class="alert alert--emergency-access" data-initialized="false" data-access-expires="{$access-type/Expires}" data-access-expires-seconds="{$access-type/Expires}">
      <xsl:attribute name="id">access-emergency-access</xsl:attribute>
      <xsl:attribute name="data-access-granted">true</xsl:attribute>

      <p style="margin-right: 1rem">
        <xsl:text>This work is checked out to you until </xsl:text>
        <span class="expires-display"></span>
        <xsl:text> and may automatically renew. </xsl:text>
        <xsl:text>Access to this work is provided through the </xsl:text>
        <a href="{$etas_href}">Emergency Temporary Access Service</a>
        <xsl:text>.</xsl:text>
      </p>

      <div class="alert--emergency-access--options">
        <a class="btn btn-default" style="white-space: nowrap" href="{$access-type/Action}">Return Early</a>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-in-library-user-header">
    <xsl:variable name="access-type" select="//AccessType" />
    <div class="alert alert--emergency-access" data-initialized="false" data-access-expires="{$access-type/Expires}" data-access-expires-seconds="{$access-type/Expires}">
      <xsl:attribute name="id">access-emergency-access</xsl:attribute>
      <xsl:attribute name="data-access-granted">true</xsl:attribute>

      <p style="margin-right: 1rem">
        <xsl:text>This work is checked out to you until </xsl:text>
        <span class="expires-display"></span>
        <xsl:text>. You may be able to renew the book. </xsl:text>
        <br />
        <xsl:text>This work may be in copyright. You have full view access to this item based on your affiliation or account privileges. </xsl:text>
        <br />
        <xsl:text>Information about use can be found in the </xsl:text>
        <a href="https://www.hathitrust.org/access_use#ic">HathiTrust Access and Use Policy</a>
        <xsl:text>.</xsl:text>
      </p>

      <div class="alert--emergency-access--options">
        <a class="btn btn-default" style="white-space: nowrap" href="{$access-type/Action}">Return Early</a>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-ssd-session-header">
    <div class="alert alert--emergency-access" data-initialized="true">
      <!-- <xsl:attribute name="id">access-emergency-access</xsl:attribute> -->
      <xsl:attribute name="data-access-granted">true</xsl:attribute>
      <div>
        <p>This work may be in copyright. You have full view access to this item based on your account privileges. 
        Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic">HathiTrust Access and Use Policy</a>.
        <!-- <br />
        A <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only version</xsl:element> is also available. More information is available at <a href="https://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a> -->
        </p>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="setup-body-tail">
    <!-- define a modal -->
    <div class="modal micromodal-slide" id="search-modal" aria-hidden="true">
        <div class="modal__overlay" tabindex="-1" data-micromodal-close="true">
          <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">
            <form action="/cgi/ls/one" method="GET" role="search">
              <div class="modal__header">
                <h2 class="modal__title" id="search-modal-title">
                  Search HathiTrust
                </h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close="true"></button>
              </div>
              <div class="modal__content" id="search-modal-content">
                 <!-- <form class="nav-search-form form-inline" action="/cgi/ls/one" method="GET" role="search"> -->
                   <xsl:call-template name="global-search-form-fieldset" />
                   <xsl:call-template name="global-search-form-options" />
                <!-- </form> -->
              </div>
              <div class="modal__footer">
                <button class="modal__btn btn" data-micromodal-close="true" aria-label="Close modal">Close</button>
                <button class="modal__btn btn btn-primary">Search</button>
              </div>
            </form>
          </div>
        </div>
      </div>
  </xsl:template>


  <xsl:template name="nav-search-form" mode="old">
    <form class="nav-search-form form-inline relative" action="/cgi/ls/one" method="GET" role="search">
      <xsl:call-template name="global-search-form-fieldset" />
      <xsl:call-template name="global-search-form-options" />
   </form>
  </xsl:template>

  <xsl:template name="global-search-form-fieldset">
    <xsl:variable name="target">
      <xsl:call-template name="header-search-target" />
    </xsl:variable>
    <div style="display: flex">
      <div class="control control-q1">
        <label for="q1-input" class="offscreen" >Search</label>
        <input id="q1-input" name="q1" type="text" class="search-input-text" placeholder="Search words about or within the items" required="required" pattern="^(?!\s*$).+">
          <xsl:attribute name="value">
            <xsl:call-template name="header-search-q1-value" />
          </xsl:attribute>
        </input>
      </div>
      <div class="control control-searchtype">
        <xsl:if test="$target = 'ls'">
          <xsl:attribute name="style">display: none;</xsl:attribute>
        </xsl:if>
        <label for="search-input-select" class="offscreen">Search Field List</label>
        <select id="search-input-select" size="1" class="search-input-select" name="searchtype" style="font-size: 1rem">
          <xsl:call-template name="search-input-select-options" />
        </select>
      </div>
    </div>
    <!-- <button class="button control control-search">Search</button> -->
  </xsl:template>

  <xsl:template name="global-search-form-options">
    <div class="global-search-options">
      <div class="search-target">
        <xsl:call-template name="global-search-target-options" />
      </div>
      <div class="global-search-ft">
        <xsl:call-template name="global-search-ft-options" />
      </div>
    </div>
    <div class="global-search-links">
      <xsl:call-template name="global-search-links" />
    </div>
  </xsl:template>

  <xsl:template name="global-search-form-options-modal">
    <div class="global-search-modal">
      <div class="global-search-modal-inner">
        <div class="global-search-options">
          <div class="search-target">
            <xsl:call-template name="global-search-target-options" />
          </div>
          <div class="global-search-ft">
            <xsl:call-template name="global-search-ft-options" />
          </div>
        </div>
        <div class="global-search-links">
          <xsl:call-template name="global-search-links" />
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="global-search-target-options">
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

  <xsl:template name="global-search-ft-options">
    <xsl:variable name="checked">
      <xsl:call-template name="header-search-ft-value" />
    </xsl:variable>
    <input type="checkbox" name="ft" value="ft" id="global-search-ft">
      <xsl:if test="normalize-space($checked)">
        <xsl:attribute name="checked">checked</xsl:attribute>
      </xsl:if>
    </input>
    <label for="global-search-ft">Full view only</label>
  </xsl:template>

  <xsl:template name="global-search-links">
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
  </xsl:template>

  <xsl:template name="build-main-container">
    <main class="main-container" id="main">
      <xsl:call-template name="header" />
      <div class="container flex-container container-boxed container-full">
        <div class="sidebar-container" id="sidebar" tabindex="0">
          <button class="for-mobile sidebar-toggle-button filter-group-toggle-show-button" aria-expanded="false">
            <span class="flex-space-between flex-center">
              <span class="filter-group-heading">Options</span>
              <!-- <svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#panel-collapsed"></use></svg> -->
              <i class="icomoon icomoon-sidebar-toggle" aria-hidden="true"></i>
            </span>
          </button>

          <xsl:call-template name="sidebar" />
        </div>
        <div class="sidebar-toggle">
          <button id="action-toggle-sidebar" aria-expanded="true">
            <i class="icomoon toggle-sidebar"></i>
            <span class="offscreen">About this Book/Tools Sidebar</span>
          </button>
        </div>
        <section class="section-container" id="section" tabindex="0">
          <xsl:call-template name="main" />
        </section>
      </div>
      <xsl:call-template name="get-access-statements" />
      <xsl:call-template name="build-main-container-extra" />
    </main>
  </xsl:template>

  <xsl:template name="build-main-container-extra" />

  <xsl:template name="contents-boo">
    <aside class="side-container" id="sidebar" tabindex="0"><xsl:call-template name="sidebar" /></aside>
    <main class="main-container" id="main" tabindex="0">
      <xsl:call-template name="main" />
    </main>
  </xsl:template>

  <xsl:template name="contents-grid1">
    <!-- h2 ? -->

    <main>
      <div class="container">
        <aside><xsl:call-template name="sidebar" /></aside>
        <section id="main" tabindex="0"><xsl:call-template name="main" /></section>
      </div>
    </main>
    <!-- <xsl:call-template name="pageviewer-contents" />
    <xsl:call-template name="get-access-statements" /> -->
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="sidebar" />
    <xsl:call-template name="main" />
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="suffix">
        <xsl:call-template name="get-title-suffix" />
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="action-search-volume">
    <!-- <h3 class="offscreen">Search in this volume</h3> -->
    <form class="form-inline form-search-volume" method="get" id="form-search-volume" role="search">
      <xsl:attribute name="action">
        <xsl:choose>
          <xsl:when test="$gUsingSearch = 'true'">/cgi/pt/search</xsl:when>
          <xsl:otherwise>/cgi/pt/search</xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <label for="input-search-text">Search in this text </label>
      <input id="input-search-text" name="q1" type="text" class="input-small">
        <xsl:if test="$gHasOcr!='YES'">
          <xsl:attribute name="disabled">disabled</xsl:attribute>
        </xsl:if>
        <xsl:attribute name="placeholder">
          <xsl:choose>
            <xsl:when test="$gHasOcr = 'YES'">
              <!-- <xsl:text>Search in this text</xsl:text> -->
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>No text to search in this item</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        <xsl:attribute name="value">
          <xsl:if test="$gHasOcr = 'YES' and $gCurrentQ1 != '*'">
            <xsl:value-of select="$gCurrentQ1" />
          </xsl:if>
        </xsl:attribute>
      </input>
      <button type="submit" class="btn dark" data-trigger="search">Find</button>
      <xsl:apply-templates select="//MdpApp/SearchForm/HiddenVars" />
      <input type="hidden" name="view" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']}" />
      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
        <input type="hidden" name="seq" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']}" />
      </xsl:if>
      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']">
        <input type="hidden" name="num" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']}" />
      </xsl:if>
      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
        <input type="hidden" name="debug" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']}" />
      </xsl:if>
    </form>
  </xsl:template>

  <xsl:template name="get-access-statements">
    <!-- access banners are hidden and exposed by access_banner.js -->
    <xsl:if test="false() and $gFinalAccessStatus='allow' and $gInCopyright='true'">
      <xsl:choose>
        <xsl:when test="$gLoggedIn='YES'">
          <xsl:choose>
            <xsl:when test="$gSSD_Session='true'">
              <xsl:call-template name="access_banner_ssd"/>
            </xsl:when>
            <xsl:when test="//AccessType/Name = 'emergency_access_affiliate'">
            </xsl:when>
            <xsl:otherwise>
              <xsl:call-template name="access_banner"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="access_banner_local"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <xsl:template name="access_banner_ssd">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>Hi <xsl:value-of select="$gUserName"/>! This work may be in copyright. You have full view access to this item based on your account privileges.<br /><br />Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic">HathiTrust Access and Use Policy</a>.<br /><br />A <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only version</xsl:element> is also available. More information is available at <a href="https://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a></p></div></div>
  </xsl:template>

  <xsl:template name="access_banner">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>Hi <xsl:value-of select="$gUserName"/>! This work may be in copyright. You have full view access to this item based on your affiliation or account privileges.<br /><br />Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic">HathiTrust Access and Use Policy</a>.</p></div></div>
  </xsl:template>

  <xsl:template name="access_banner_local">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>This work may be in copyright. You have full view access to this item based on your affiliation or account privileges.<br /><br />Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic">HathiTrust Access and Use Policy</a>.</p></div></div>
  </xsl:template>

  <xsl:template name="html-tag-extra-attributes" />
  <xsl:template name="include_extra_js_and_css" />
  <xsl:template name="setup-head" />
  <xsl:template name="item-viewer" />

  <xsl:template name="get-title-suffix">
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template>

  <xsl:template name="get-tracking-category">PT</xsl:template>

</xsl:stylesheet>

