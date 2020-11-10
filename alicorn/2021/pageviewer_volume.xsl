<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:h="http://www.hathitrust.org"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS h"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:variable name="gNumTerms" select="count(/MBooksTop/MdpApp/SearchTerms/Terms/Term)"/>
  <xsl:variable name="gMultiTerm" select="/MBooksTop/MdpApp/SearchTerms/MultiTerm"/>
  <xsl:variable name="gPagesFound" select="/MBooksTop/MdpApp/SearchSummary/TotalPages"/>
  <xsl:variable name="gSearchTerms" select="/MBooksTop/MdpApp/SearchTerms/Terms"/>
  <xsl:variable name="gSearchResults" select="/MBooksTop/MdpApp/SearchResults"/>
  <xsl:variable name="gValidBoolean" select="/MBooksTop/MdpApp/SearchResults/ValidBooleanExpression"/>
  <xsl:variable name="gHasPageNumbers" select="/MBooksTop/MdpApp/HasPageNumbers"/>

  <xsl:variable name="gSearchOp">
    <xsl:variable name='ptsop_var' select="//CurrentCgi/Param[@name='ptsop']"/>
    <xsl:choose>
      <xsl:when test="$ptsop_var='AND' or $ptsop_var='and'">
        <xsl:text>AND</xsl:text>
      </xsl:when>
      <xsl:when test="$ptsop_var='OR' or $ptsop_var='or'">
        <xsl:text>OR</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>AND</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="vNatLangQuery">
    <xsl:call-template name="buildNatLangQuery"/>
  </xsl:variable>

  <xsl:template name="setup-extra-header-extra">
    <link rel="stylesheet" href="/alicorn/2021/css/main2.css" />
  </xsl:template>

  <xsl:template name="build-text-only-link">
    <xsl:variable name="seq" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
    <a id="ssd-link">
      <xsl:attribute name="href">
        <xsl:text>/cgi/ssd?id=</xsl:text>
        <xsl:value-of select="$gHtId"/>
        <xsl:choose>
          <xsl:when test="$seq != '' and $gViewingMode = 'entire-volume'">
            <xsl:text>#seq</xsl:text>
            <xsl:value-of select="$seq" />
          </xsl:when>
          <xsl:when test="$seq">
            <xsl:text>;seq=</xsl:text>
            <xsl:value-of select="$seq" />
          </xsl:when>
          <xsl:otherwise />
        </xsl:choose>
      </xsl:attribute>
      <xsl:text>text-only view of this item.</xsl:text>
    </a>
  </xsl:template>

  <xsl:template name="build-box-main">
    <div class="box-main">
      <xsl:call-template name="build-box-sidebar" />
      <xsl:call-template name="build-box-panels" />
      <xsl:call-template name="build-box-section" />
    </div>
  </xsl:template>

  <xsl:template name="build-box-sidebar">
    <div class="box-sidebar">

      <button class="btn" data-action="action-toggle-toolbar">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-caret-up-fill</xsl:with-param>
          <xsl:with-param name="class">toggle-on</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-caret-down-fill</xsl:with-param>
          <xsl:with-param name="class">toggle-off</xsl:with-param>
        </xsl:call-template>
        <span>Toggle toolbar</span>
      </button>


      <button class="btn" data-target="panel-about">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-info-square</xsl:with-param>
        </xsl:call-template>
        <span>About this item</span>
      </button>

      <button class="btn" data-target="panel-search">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-search</xsl:with-param>
        </xsl:call-template>
        <span>Search inside</span>
      </button>

      <button class="btn" data-target="panel-contents">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-list</xsl:with-param>
        </xsl:call-template>
        <span>Contents</span>
      </button>

      <button class="btn" data-target="panel-download">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-download</xsl:with-param>
        </xsl:call-template>
        <span>Download</span>
      </button>

      <button class="btn" data-target="panel-configure">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-sliders</xsl:with-param>
        </xsl:call-template>
        <span>Configure</span>
      </button>

      <!-- <button class="btn" data-target="panel-get">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-bag-fill</xsl:with-param>
        </xsl:call-template>
        <span>Get this item</span>
      </button> -->

      <button class="btn" data-target="panel-share">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-share-fill</xsl:with-param>
        </xsl:call-template>
        <span>Share</span>
      </button>

      <button class="btn" data-target="panel-bookmark">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-bookmark-fill</xsl:with-param>
        </xsl:call-template>
        <span>Bookmark</span>
      </button>

      <!-- <button class="btn" data-target="panel-info">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-journal-code</xsl:with-param>
        </xsl:call-template>
        <span>Version</span>
      </button> -->

      <button class="btn" data-action="action-toggle-fullscreen">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-arrows-fullscreen</xsl:with-param>
          <xsl:with-param name="class">toggle-on</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-fullscreen-exit</xsl:with-param>
          <xsl:with-param name="class">toggle-off</xsl:with-param>
        </xsl:call-template>
        <span>Toggle Fullscreen</span>
      </button>


    </div>
  </xsl:template>

  <xsl:template name="build-box-panels">
    <div class="box-panels">
      <xsl:call-template name="build-panel-about" />
      <xsl:call-template name="build-panel-search" />
      <xsl:call-template name="build-panel-contents" />
      <xsl:call-template name="build-panel-download" />
      <xsl:call-template name="build-panel-configure" />
      <!-- <xsl:call-template name="build-panel-get" /> -->
      <xsl:call-template name="build-panel-share" />
      <xsl:call-template name="build-panel-bookmark" />
      <!-- <xsl:call-template name="build-panel-info" /> -->
    </div>
  </xsl:template>

  <xsl:template name="build-box-section">
    <section class="box-reader-main" data-view="image">
      <div class="box-reader-wrap">
        <div class="box-reader">
        </div>
      </div>
      <div class="box-reader-toolbar">
        <xsl:call-template name="build-box-reader-toolbar-navigator" />
        <xsl:call-template name="build-box-reader-toolbar-paginator" />
      </div>
    </section>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/randomcolor/0.6.1/randomColor.min.js" integrity="sha512-vPeZ7JCboHcfpqSx5ZD+/jpEhS4JpXxfz9orSvAPPj0EKUVShU2tgy7XkU+oujBJKnWmu4hU7r9MMQNWPfXsYw==" crossorigin="anonymous"></script>
    <script src="/PicLoader/index.js"></script>
    <script type="application/javascript" src="/alicorn/2021/js/demo.js"></script>
    <script type="application/javascript" src="/alicorn/2021/js/reader.image.js"></script>
    <!-- <script type="application/javascript" src="/alicorn/2021/js/reader.js"></script> -->
  </xsl:template>

  <xsl:template name="build-box-reader-toolbar-navigator">
    <xsl:variable name="currentSeq" select="//Param[@name='seq']" />
    <xsl:variable name="totalSeq" select="count(//METS:structMap[@TYPE='physical']/METS:div[@TYPE]/METS:div[@ORDER])" />

    <form class="box-reader-toolbar-navigator">
      <div class="navigator-range-wrap">
        <input class="navigator-range" type="range" min="1" max="50" value="15" />
      </div>
      <div class="navigator-output">
        <!-- <span data-slot="seq">15</span> -->
        <span>#</span>
        <input type="text" name="navigator-input-seq">
          <xsl:attribute name="size">
            <xsl:value-of select="string-length($totalSeq)" />
          </xsl:attribute>
        </input>
        <span> / </span>
        <span data-slot="total-seq"><xsl:value-of select="$totalSeq" /></span>
      </div>
      <!-- <button>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-card-list</xsl:with-param>
        </xsl:call-template>
        <span>Jump...</span>
      </button> -->
    </form>
  </xsl:template>

  <xsl:template name="build-box-reader-toolbar-paginator">
    <div class="box-reader-toolbar-paginator">
      <button class="btn" aria-label="Previous">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-arrow-left-circle-fill</xsl:with-param>
        </xsl:call-template>
      </button>
      <button class="btn" aria-label="Next">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-arrow-right-circle-fill</xsl:with-param>
        </xsl:call-template>
      </button>
    </div>
  </xsl:template>

  <xsl:template name="build-panel-about">
    <div id="panel-about" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">About this item</xsl:with-param>
      </xsl:call-template>
      <p>
        <xsl:variable name="record_no">
          <xsl:value-of select="$gCatalogRecordNo"/>
        </xsl:variable>
        <xsl:choose>
          <xsl:when test="$record_no!=''">
            <xsl:element name="a">
              <xsl:variable name="href">
                <xsl:text>https://catalog.hathitrust.org/Record/</xsl:text>
                <xsl:value-of select="$record_no"/>
              </xsl:variable>
              <xsl:attribute name="data-toggle">tracking</xsl:attribute>
              <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
              <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
              <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
              <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
              <xsl:text>View full catalog record</xsl:text>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="display-catalog-record-not-available" />
          </xsl:otherwise>
        </xsl:choose>
      </p>
      <xsl:if test="false()">
      <p class="offscreen">
        <!-- not visible -->
        <xsl:call-template name="BuildRDFaWrappedAuthor"/>
        <!-- not visible -->
        <xsl:call-template name="BuildRDFaWrappedPublished"/>
        <!-- not visible -->
        <xsl:call-template name="BuildRDFaWrappedDescription" />
      </p>
      </xsl:if>

      <dl class="item-metadata">
        <xsl:if test="$gHasMARCAuthor">
          <dt>Author</dt>
          <dd>
            <xsl:call-template name="BuildRDFaWrappedAuthor">
              <xsl:with-param name="visible" select="'visible'"/>
            </xsl:call-template>
          </dd>
        </xsl:if>

        <xsl:if test="$gMdpMetadata/datafield[@tag='250']/subfield">
          <dt>Edition</dt>
          <dd>
              <xsl:value-of select="$gMdpMetadata/datafield[@tag='250']/subfield"/>
          </dd>
        </xsl:if>

        <dt>Published</dt>
        <dd>
          <xsl:call-template name="BuildRDFaWrappedPublished">
            <xsl:with-param name="visible" select="'visible'"/>
          </xsl:call-template>
        </dd>

        <xsl:if test="$gMdpMetadata/datafield[@tag='300']/subfield">
          <dt>Description</dt>
          <dd>
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='a']"/>
            &#x20;
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='b']"/>
            &#x20;
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='c']"/>
          </dd>
        </xsl:if>
      </dl>

      <h3 style="border-bottom: none; font-size: 0.9rem; padding-bottom: 0; margin-top: 1rem; margin-bottom: 0">Rights</h3>
      <p class="smaller" style="margin-top: 0.25rem">
        <xsl:call-template name="BuildRDFaCCLicenseMarkup" />
      </p>

      <h3 style="border-bottom: none; font-size: 0.9rem; padding-bottom: 0; margin-top: 1rem; margin-bottom: 0">Get this item</h3>
      <ul>
        <xsl:call-template name="find-in-library" />
        <xsl:call-template name="buy-this-item" />
      </ul>

      <h3 style="border-bottom: none; font-size: 0.9rem; padding-bottom: 0; margin-top: 1rem; margin-bottom: 0">Version</h3>
      <p>
        <span class="version-label"><xsl:value-of select="$gVersionLabel" /></span>
        <!-- <br />
        <a id="versionIcon" href="#">About the version <i class="icomoon icomoon-help" aria-hidden="true"></i></a> -->
      </p>

      <p style="font-size: 0.875rem">
        This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <a href="#">Contact us</a> for more information.
      </p>


    </div>
  </xsl:template>

  <xsl:template name="build-panel-header">
    <xsl:param name="label" />
    <h2>
      <span><xsl:value-of select="$label" /></span>
      <button class="btn" data-action="close-panel">
        <span class="offscreen">Close Panel</span>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-x-circle</xsl:with-param>
        </xsl:call-template>
      </button>
    </h2>
  </xsl:template>

  <xsl:template name="build-panel-search">
    <div id="panel-search" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">Search in this text</xsl:with-param>
      </xsl:call-template>
      <form class="inline">
        <div class="input-control">
          <label class="offscreen" for="q1">Search term</label>
          <input id="q1" type="text" name="q1" />
        </div>
        <button>Find</button>
      </form>
      <hr />
      <xsl:call-template name="build-panel-search-results" />
    </div>
  </xsl:template>

  <xsl:template name="build-panel-contents">
    <div id="panel-contents" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">Contents</xsl:with-param>
      </xsl:call-template>
      <ul>
        <xsl:for-each select="$gFeatureList/Feature">
          <li>
            <a href="{Link}" data-seq="{Seq}">
              <xsl:value-of select="Label" />
              <xsl:if test="normalize-space(Page)">
                <xsl:text> - </xsl:text>
                <xsl:value-of select="Page" />
              </xsl:if>
            </a>
          </li>
        </xsl:for-each>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="build-panel-download">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <div id="panel-download" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">Download</xsl:with-param>
      </xsl:call-template>
      <ul>
        <xsl:call-template name="download-links">
          <xsl:with-param name="pViewTypeList" select="$pViewTypeList" />
        </xsl:call-template>
      </ul>
      <xsl:call-template name="no-download-access" />
    </div>
  </xsl:template>

  <xsl:template name="build-panel-configure">
    <div id="panel-configure" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">Configure</xsl:with-param>
      </xsl:call-template>
    </div>
  </xsl:template>

  <xsl:template name="build-panel-get">
    <div id="panel-get" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">Get this item</xsl:with-param>
      </xsl:call-template>
      <ul>
        <xsl:call-template name="find-in-library" />
        <xsl:call-template name="buy-this-item" />
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="build-panel-share">
    <xsl:variable name="pageLink">
      <xsl:call-template name="get-sharable-handle-link" />
    </xsl:variable>
    <div id="panel-share" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">Share</xsl:with-param>
      </xsl:call-template>

      <xsl:call-template name="build-share-social-links">
        <xsl:with-param name="pageLink" select="$pageLink" />
      </xsl:call-template>

      <form action="" name="urlForm" id="urlForm">
        <p>
          <label class="smaller" for="permURL">Permanent link to this book</label>
          <xsl:element name="input">
            <xsl:attribute name="type">text</xsl:attribute>
            <xsl:attribute name="name">permURL_link</xsl:attribute>
            <xsl:attribute name="id">permURL</xsl:attribute>
            <xsl:attribute name="class">email-permURL</xsl:attribute>
            <xsl:attribute name="onclick">document.urlForm.permURL_link.select();</xsl:attribute>
            <xsl:attribute name="data-toggle">tracking</xsl:attribute>
            <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
            <xsl:attribute name="data-tracking-action">PT Link to this Book</xsl:attribute>
            <xsl:attribute name="data-tracking-label"><xsl:value-of select="$gItemHandle" /></xsl:attribute>
            <xsl:attribute name="readonly">readonly</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="$gItemHandle"/>
            </xsl:attribute>
          </xsl:element>
        </p>

        <p>

          <label class="smaller" for="pageURL">Link to this page</label>

          <xsl:element name="input">
            <xsl:attribute name="type">text</xsl:attribute>
            <xsl:attribute name="name">pageURL_link</xsl:attribute>
            <xsl:attribute name="id">pageURL</xsl:attribute>
            <xsl:attribute name="class">email-permURL</xsl:attribute>
            <xsl:attribute name="onclick">document.urlForm.pageURL_link.select();</xsl:attribute>
            <xsl:attribute name="data-toggle">tracking</xsl:attribute>
            <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
            <xsl:attribute name="data-tracking-action">PT Link to this Page</xsl:attribute>
            <xsl:attribute name="readonly">readonly</xsl:attribute>
            <xsl:attribute name="data-tracking-label"><xsl:value-of select="$pageLink" /></xsl:attribute>
            <xsl:attribute name="value"><xsl:value-of select="$pageLink" /></xsl:attribute>
          </xsl:element>
        </p>
      </form>

      <xsl:if test="$gFinalAccessStatus = 'allow'">
        <p>
          <xsl:element name="a">
            <xsl:attribute name="id">embedHtml</xsl:attribute>
            <xsl:attribute name="default-form">data-default-form</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="' '"/>
            </xsl:attribute>
            <xsl:text>Embed this book</xsl:text>
          </xsl:element>
        </p>
      </xsl:if>
    </div>
  </xsl:template>

  <xsl:template name="build-panel-bookmark">
    <div id="panel-bookmark" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">Bookmark</xsl:with-param>
      </xsl:call-template>
      <xsl:call-template name="CollectionWidgetContainer" />
    </div>
  </xsl:template>

  <xsl:template name="build-panel-info">
    <div id="panel-info" class="panel">
      <xsl:call-template name="build-panel-header">
        <xsl:with-param name="label">Version</xsl:with-param>
      </xsl:call-template>
      <p>
        <span class="version-label"><xsl:value-of select="$gVersionLabel" /></span>
        <br />
        <a id="versionIcon" href="#">About the version <i class="icomoon icomoon-help" aria-hidden="true"></i></a>
      </p>
    </div>
  </xsl:template>


  <!-- UTILITY -->
  <xsl:template name="build-panel-search-results">
    <xsl:variable name="page_string">
      <xsl:choose>
        <xsl:when test="$gPagesFound > 1 or $gPagesFound = 0"><xsl:text> pages </xsl:text></xsl:when>
        <xsl:when test="$gPagesFound = 1"><xsl:text> page</xsl:text></xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="slice-end" select="/MBooksTop/MdpApp/SliceNavigationLinks/End" />
    <xsl:variable name="slice-start" select="/MBooksTop/MdpApp/SliceNavigationLinks/Start" />

    <div class="alert alert-info alert-block">
      <p>
        <xsl:value-of select="concat('Showing ',$slice-start,' - ',$slice-end,' of ',//TotalPages,' Results for ')"/>
        <span class="mdpEmp"><xsl:value-of select="$vNatLangQuery"/></span>
      </p>
    </div>

    <xsl:call-template name="build-results-list" />

  </xsl:template>

  <xsl:template name="build-results-list">
    <xsl:for-each select="$gSearchResults/Page">
      <xsl:variable name="page_label">
        <xsl:choose>
          <xsl:when test="$gHasPageNumbers='true'">
            <xsl:choose>
              <xsl:when test="PageNumber=''">
                <xsl:text>unnumbered page</xsl:text>
              </xsl:when>
              <xsl:otherwise>
                <xsl:text>Page </xsl:text>
                <xsl:value-of select="PageNumber"/>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>sequence No.</xsl:text>
            <xsl:value-of select="Sequence"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      <article class="result">
        <h3 class="results-header">
          <xsl:choose>
            <xsl:when test="$gFinalAccessStatus = 'allow'">
              <a href="{Link}" data-seq="{Sequence}"><xsl:value-of select="$page_label" /></a>
            </xsl:when>
            <xsl:otherwise>
              <span><xsl:value-of select="$page_label" /></span>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:text>&#xa0;-&#xa0;</xsl:text>
          <xsl:value-of select="Hits" />
          <xsl:choose>
            <xsl:when test="Hits > 1">
              <xsl:text>&#xa0;matching terms</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>&#xa0;matching term</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </h3>
        <xsl:for-each select="Kwic">
          <p class="kwic">
            <xsl:text>...</xsl:text>
            <xsl:apply-templates select="." mode="copy" />
            <xsl:text>...</xsl:text>
          </p>
        </xsl:for-each>
      </article>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="buildNatLangQuery">
    <xsl:choose>
      <!-- emit entire expression -->
      <xsl:when test="$gValidBoolean=1">
        <xsl:for-each select="$gSearchTerms/Term">
          <xsl:value-of select="."/>
        </xsl:for-each>
      </xsl:when>
      <!-- emit terms joined with OP -->
      <xsl:when test="$gNumTerms >= 1">
        <xsl:for-each select="$gSearchTerms/Term">
          <xsl:value-of select="."/>
          <xsl:if test="position()!=last()">
            <xsl:value-of select="concat(' ', $gSearchOp, ' ')"/>
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="Kwic">
    <xsl:copy-of select="./node()"/>
  </xsl:template>

</xsl:stylesheet>